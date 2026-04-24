import { client } from '@finance-bot/db';
import { logger } from '../lib/logger.js';
import type { MiddlewareFn } from 'grammy';
import type { BotContext } from '../types.js';

const WINDOW_MS = 1000; // 1 second window
const MAX_REQUESTS = 1; // max per window
const CLEANUP_INTERVAL_MS = 60_000;
const STALE_AGE_MS = 3_600_000; // delete buckets older than 1 hour

let lastCleanup = 0;

// Atomically upsert the rate limit bucket and return whether the request is allowed.
// client.transaction(fn) returns a new function — call it directly.
function checkAndIncrement(telegramId: number, now: number): boolean {
  const checkTx = client.transaction(() => {
    const row = client
      .prepare(`SELECT window_start, request_count FROM rate_limit_buckets WHERE telegram_id = ?`)
      .get(telegramId) as { window_start: number; request_count: number } | undefined;

    const windowStart = row ? row.window_start : now;
    const isNewWindow = now - windowStart >= WINDOW_MS;
    const count = isNewWindow ? 1 : (row?.request_count ?? 0) + 1;
    const newWindowStart = isNewWindow ? now : windowStart;

    client
      .prepare(
        `INSERT OR REPLACE INTO rate_limit_buckets (telegram_id, window_start, request_count, updated_at)
         VALUES (?, ?, ?, ?)`
      )
      .run(telegramId, newWindowStart, count, now);

    return count <= MAX_REQUESTS;
  });

  return checkTx();
}

export const sqliteRateLimit: MiddlewareFn<BotContext> = async (ctx, next) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return next();

  const now = Date.now();

  // Periodic cleanup of stale buckets
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    lastCleanup = now;
    try {
      client
        .prepare(`DELETE FROM rate_limit_buckets WHERE updated_at < ?`)
        .run(now - STALE_AGE_MS);
    } catch {
      // cleanup failure must not block requests
    }
  }

  const allowed = checkAndIncrement(telegramId, now);
  if (!allowed) {
    logger.info({ action: 'rate_limit_hit', telegramId });
    await ctx.reply('אנא המתן רגע לפני שליחת בקשה נוספת.');
    return;
  }

  return next();
};
