import { eq, sql } from 'drizzle-orm';
import { db, client } from '@finance-bot/db';
import { outboxMessages } from '@finance-bot/db/schema';
import { logger } from '../lib/logger.js';
import type { Bot } from 'grammy';
import type { BotContext } from '../types.js';

const BATCH_SIZE = 20;
const TICK_MS = 1000;
const DEAD_ALERT_COOLDOWN_MS = 3_600_000; // 1 hour
const BACKOFF_BASE_MS = 10_000;
const MAX_BACKOFF_MS = 10 * 60_000; // 10 minutes

function backoffMs(attempts: number): number {
  return Math.min(BACKOFF_BASE_MS * 2 ** (attempts - 1), MAX_BACKOFF_MS);
}

// Snake_case mirrors raw SQLite column names returned by better-sqlite3 prepared statements.
// Drizzle ORM uses camelCase, but raw SQL results use the DB column names directly.
interface OutboxClaimResult {
  id: number;
  telegram_id: number;
  text: string;
  parse_mode: string | null;
  disable_notification: number;
  attempts: number;
  max_attempts: number;
}

// Atomically claim up to BATCH_SIZE pending messages whose send_after <= now.
// client.transaction(fn) returns a new function — call it directly (no cast).
function claimMessages(now: Date): OutboxClaimResult[] {
  const claimTx = client.transaction(() => {
    // Drizzle stores timestamps as Unix seconds; pass seconds here to match.
    const nowSec = Math.floor(now.getTime() / 1000);
    const rows = client
      .prepare(
        `SELECT id, telegram_id, text, parse_mode, disable_notification, attempts, max_attempts
         FROM outbox_messages
         WHERE status = 'pending' AND send_after <= ?
         ORDER BY send_after ASC
         LIMIT ?`
      )
      .all(nowSec, BATCH_SIZE) as OutboxClaimResult[];

    if (rows.length === 0) return rows;

    const ids = rows.map((r) => r.id);
    const placeholders = ids.map(() => '?').join(', ');
    client
      .prepare(`UPDATE outbox_messages SET status = 'running' WHERE id IN (${placeholders})`)
      .run(...ids);

    return rows;
  });

  return claimTx();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createOutboxWorker(bot: Bot<BotContext>, adminChatId: number) {
  let shouldStop = false;
  let lastDeadAlert = 0;

  async function tick(): Promise<void> {
    const now = new Date();
    let rows: OutboxClaimResult[];

    try {
      rows = claimMessages(now);
    } catch (err) {
      logger.error({ action: 'outbox_claim_failed', error: String(err) });
      if (!shouldStop) setTimeout(tick, TICK_MS);
      return;
    }

    for (let i = 0; i < rows.length; i++) {
      if (i > 0) await sleep(35); // ~360 msg/min — stay under Telegram limits
      const row = rows[i];
      const newAttempts = row.attempts + 1;

      try {
        await bot.api.sendMessage(row.telegram_id, row.text, {
          parse_mode: (row.parse_mode as 'MarkdownV2' | 'HTML' | undefined) ?? undefined,
          disable_notification: Boolean(row.disable_notification),
        });

        db.update(outboxMessages)
          .set({ status: 'sent', sentAt: new Date(), attempts: newAttempts })
          .where(eq(outboxMessages.id, row.id))
          .execute();
      } catch (err) {
        const isDead = newAttempts >= row.max_attempts;
        db.update(outboxMessages)
          .set({
            status: isDead ? 'dead' : 'pending',
            attempts: newAttempts,
            lastError: String(err),
            sendAfter: isDead ? new Date() : new Date(Date.now() + backoffMs(newAttempts)),
          })
          .where(eq(outboxMessages.id, row.id))
          .execute();

        logger.error({
          action: 'outbox_send_failed',
          messageId: row.id,
          telegramId: row.telegram_id,
          attempts: newAttempts,
          dead: isDead,
          error: String(err),
        });
      }
    }

    // Dead letter monitoring — alert admin at most once per hour
    try {
      const result = db
        .select({ deadCount: sql<number>`count(*)` })
        .from(outboxMessages)
        .where(eq(outboxMessages.status, 'dead'))
        .get();

      const deadCount = result?.deadCount ?? 0;

      if (deadCount > 0 && adminChatId !== 0 && Date.now() - lastDeadAlert > DEAD_ALERT_COOLDOWN_MS) {
        lastDeadAlert = Date.now();
        await bot.api.sendMessage(
          adminChatId,
          `⚠️ ${deadCount} הודעות נכשלו בתור המשלוח \\(dead\\)\\. בדוק את הלוגים\\.`,
          { parse_mode: 'MarkdownV2' }
        );
      }
    } catch {
      // monitoring failure must never crash the worker
    }

    if (!shouldStop) setTimeout(tick, TICK_MS);
  }

  return {
    start(): void {
      // Recover messages stuck in 'running' from previous crash.
      // send_after is stored as Unix seconds — pass Math.floor(ms/1000).
      client
        .prepare(`UPDATE outbox_messages SET status = 'pending', send_after = ? WHERE status = 'running'`)
        .run(Math.floor(Date.now() / 1000));
      logger.info({ action: 'outbox_worker_started' });
      setTimeout(tick, TICK_MS);
    },
    stop(): void {
      shouldStop = true;
      logger.info({ action: 'outbox_worker_stopped' });
    },
  };
}
