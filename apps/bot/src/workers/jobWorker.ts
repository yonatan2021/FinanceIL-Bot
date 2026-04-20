import type { Bot } from 'grammy';
import type { BotContext } from '../types.js';
import { db } from '@finance-bot/db';
import { jobQueue } from '@finance-bot/db/schema';
import { and, eq, lte, asc } from 'drizzle-orm';
import type { JobType } from '@finance-bot/types';
import { JOB_HANDLERS } from './jobHandlers.js';
import { logger } from '../lib/logger.js';

const TICK_INTERVAL_MS = 5000;

export interface JobWorker {
  stop: () => void;
}

function backoffMs(attempts: number): number {
  return Math.min(30_000 * 2 ** (attempts - 1), 10 * 60_000);
}

function recoverZombieJobs(): void {
  const reset = db
    .update(jobQueue)
    .set({ status: 'pending', startedAt: null })
    .where(eq(jobQueue.status, 'running'))
    .run();
  if (reset.changes > 0) {
    logger.info({ action: 'job_worker_zombie_recovery', reset: reset.changes });
  }
}

export function startJobWorker(bot: Bot<BotContext>): JobWorker {
  let shouldStop = false;
  let isRunning = false;

  recoverZombieJobs();

  async function tick(): Promise<void> {
    if (shouldStop || isRunning) return;
    isRunning = true;

    try {
      await processNextJob();
    } catch (err) {
      logger.error({ action: 'job_worker_tick_error', errorMessage: (err as Error).message });
    } finally {
      isRunning = false;
    }

    if (!shouldStop) {
      setTimeout(() => void tick(), TICK_INTERVAL_MS);
    }
  }

  async function processNextJob(): Promise<void> {
    const now = new Date();

    // Claim one job atomically
    const claimed = db.transaction((tx) => {
      const row = tx
        .select()
        .from(jobQueue)
        .where(and(eq(jobQueue.status, 'pending'), lte(jobQueue.runAfter, now)))
        .orderBy(asc(jobQueue.id))
        .limit(1)
        .get();

      if (!row) return null;

      tx.update(jobQueue)
        .set({ status: 'running', startedAt: now, attempts: row.attempts + 1 })
        .where(eq(jobQueue.id, row.id))
        .run();

      return { ...row, attempts: row.attempts + 1 };
    });

    if (!claimed) return;

    const handler = JOB_HANDLERS[claimed.type as JobType];
    if (!handler) {
      db.update(jobQueue)
        .set({ status: 'dead', finishedAt: new Date(), lastError: `Unknown job type: ${claimed.type}` })
        .where(eq(jobQueue.id, claimed.id))
        .run();
      logger.error({ action: 'job_unknown_type', type: claimed.type, jobId: claimed.id });
      return;
    }

    try {
      const payload = JSON.parse(claimed.payload) as Record<string, unknown>;
      await handler(payload, bot);

      db.update(jobQueue)
        .set({ status: 'done', finishedAt: new Date(), result: 'ok' })
        .where(eq(jobQueue.id, claimed.id))
        .run();

      logger.info({ action: 'job_completed', type: claimed.type, jobId: claimed.id, attempts: claimed.attempts });
    } catch (err) {
      const lastError = (err as Error).message;
      const finishedAt = new Date();

      if (claimed.attempts >= claimed.maxAttempts) {
        db.update(jobQueue)
          .set({ status: 'dead', finishedAt, lastError })
          .where(eq(jobQueue.id, claimed.id))
          .run();
        logger.error({ action: 'job_dead', type: claimed.type, jobId: claimed.id, attempts: claimed.attempts });
      } else {
        const runAfter = new Date(Date.now() + backoffMs(claimed.attempts));
        db.update(jobQueue)
          .set({ status: 'pending', finishedAt, lastError, runAfter })
          .where(eq(jobQueue.id, claimed.id))
          .run();
        logger.warn({ action: 'job_retrying', type: claimed.type, jobId: claimed.id, attempts: claimed.attempts, runAfter });
      }
    }
  }

  setTimeout(() => void tick(), TICK_INTERVAL_MS);

  return {
    stop: () => { shouldStop = true; },
  };
}
