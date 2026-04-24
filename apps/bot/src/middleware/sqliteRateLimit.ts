import { logger } from '../lib/logger.js';
import type { MiddlewareFn } from 'grammy';
import type { BotContext } from '../types.js';
import { checkAndIncrementRateLimit, cleanupStaleRateLimitBuckets } from '../queries.js';

const MAX_REQUESTS = 1; // max per 1-second window
const CLEANUP_INTERVAL_MS = 60_000;
const STALE_AGE_MS = 3_600_000; // delete buckets older than 1 hour

let lastCleanup = 0;

export const sqliteRateLimit: MiddlewareFn<BotContext> = async (ctx, next) => {
  const telegramId = ctx.from?.id;
  if (!telegramId) return next();

  const now = Date.now();

  // Periodic cleanup of stale buckets
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    lastCleanup = now;
    try {
      cleanupStaleRateLimitBuckets(now - STALE_AGE_MS);
    } catch {
      // cleanup failure must not block requests
    }
  }

  const allowed = checkAndIncrementRateLimit(telegramId, now, MAX_REQUESTS);
  if (!allowed) {
    logger.info({ action: 'rate_limit_hit', telegramId });
    await ctx.reply('אנא המתן רגע לפני שליחת בקשה נוספת.');
    return;
  }

  return next();
};
