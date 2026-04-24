import { eq, and, lte, or } from 'drizzle-orm';
import { db, client } from '@finance-bot/db';
import { jobQueue } from '@finance-bot/db/schema';
import { logger } from '../lib/logger.js';
import type { Bot } from 'grammy';
import type { BotContext } from '../types.js';
import type { JobQueueRow } from '@finance-bot/types';
import {
  handleScrapeAll,
  handleScrapeCredential,
  handleBroadcastScheduled,
} from './jobHandlers.js';

const TICK_MS = 5000;
const BACKOFF_BASE_MS = 30_000;
const MAX_BACKOFF_MS = 10 * 60_000;
const PRUNE_INTERVAL_MS = 7 * 24 * 60 * 60_000; // 1 week
const PRUNE_AGE_MS = 30 * 24 * 60 * 60_000; // 30 days

function backoffMs(attempts: number): number {
  return Math.min(BACKOFF_BASE_MS * 2 ** (attempts - 1), MAX_BACKOFF_MS);
}

// Atomically claim one pending job whose runAfter <= now.
// client.transaction(fn) returns a new function — call it directly.
function claimJob(now: Date): JobQueueRow | null {
  // Drizzle stores timestamps as Unix seconds; pass seconds here.
  const nowSec = Math.floor(now.getTime() / 1000);
  const claimTx = client.transaction(() => {
    const row = client
      .prepare(
        `SELECT * FROM job_queue WHERE status = 'pending' AND run_after <= ? ORDER BY run_after ASC LIMIT 1`
      )
      .get(nowSec) as Record<string, unknown> | undefined;

    if (!row) return null;

    client
      .prepare(
        `UPDATE job_queue SET status = 'running', started_at = ?, attempts = attempts + 1 WHERE id = ?`
      )
      .run(nowSec, row['id']);

    return row as unknown as JobQueueRow;
  });

  return claimTx();
}

function recoverRunningJobs(): void {
  client
    .prepare(`UPDATE job_queue SET status = 'pending', started_at = NULL WHERE status = 'running'`)
    .run();
}

export function createJobWorker(bot: Bot<BotContext>, adminChatId: number) {
  let shouldStop = false;
  let lastPrune = 0;

  async function tick(): Promise<void> {
    const now = new Date();

    // Weekly prune of old done/dead jobs
    if (Date.now() - lastPrune > PRUNE_INTERVAL_MS) {
      lastPrune = Date.now();
      try {
        const cutoff = new Date(Date.now() - PRUNE_AGE_MS);
        db.delete(jobQueue)
          .where(
            and(
              or(eq(jobQueue.status, 'done'), eq(jobQueue.status, 'dead')),
              lte(jobQueue.finishedAt, cutoff)
            )
          )
          .execute();
      } catch {
        // prune failure must never crash worker
      }
    }

    let job: JobQueueRow | null;
    try {
      job = claimJob(now);
    } catch (err) {
      logger.error({ action: 'job_claim_failed', error: String(err) });
      if (!shouldStop) setTimeout(tick, TICK_MS);
      return;
    }

    if (!job) {
      if (!shouldStop) setTimeout(tick, TICK_MS);
      return;
    }

    logger.info({ action: 'job_started', jobId: job.id, type: job.type, attempt: job.attempts });

    try {
      let result: string;

      if (job.type === 'scrape_all') {
        result = await handleScrapeAll(job, bot, adminChatId);
      } else if (job.type === 'scrape_credential') {
        result = await handleScrapeCredential(job, bot, adminChatId);
      } else if (job.type === 'broadcast_scheduled') {
        result = await handleBroadcastScheduled(job);
      } else {
        throw new Error(`Unknown job type: ${(job as JobQueueRow).type}`);
      }

      db.update(jobQueue)
        .set({ status: 'done', finishedAt: new Date(), result })
        .where(eq(jobQueue.id, job.id))
        .execute();

      logger.info({ action: 'job_done', jobId: job.id, type: job.type });
    } catch (err) {
      const isDead = job.attempts >= job.maxAttempts;
      const nextRunAfter = new Date(Date.now() + backoffMs(job.attempts));

      db.update(jobQueue)
        .set({
          status: isDead ? 'dead' : 'failed',
          finishedAt: isDead ? new Date() : undefined,
          lastError: String(err),
          runAfter: isDead ? undefined : nextRunAfter,
        })
        .where(eq(jobQueue.id, job.id))
        .execute();

      logger.error({
        action: 'job_failed',
        jobId: job.id,
        type: job.type,
        attempt: job.attempts,
        dead: isDead,
        error: String(err),
      });
    }

    // Process next job immediately if there may be more in backlog
    if (!shouldStop) setTimeout(tick, 0);
  }

  return {
    start(): void {
      recoverRunningJobs();
      logger.info({ action: 'job_worker_started' });
      setTimeout(tick, TICK_MS);
    },
    stop(): void {
      shouldStop = true;
      logger.info({ action: 'job_worker_stopped' });
    },
  };
}
