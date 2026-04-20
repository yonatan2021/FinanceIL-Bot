import type { Context, NextFunction } from 'grammy';
import { db } from '@finance-bot/db';
import { rateLimitBuckets } from '@finance-bot/db/schema';
import { eq, lt } from 'drizzle-orm';

interface RateLimitOptions {
  timeFrame: number;
  limit: number;
  onLimitExceeded: (ctx: Context) => Promise<void>;
}

let lastCleanupAt = 0;

function runCleanup(): void {
  const now = Date.now();
  if (now - lastCleanupAt < 60_000) return;
  lastCleanupAt = now;
  const cutoff = new Date(now - 60 * 60 * 1000);
  db.delete(rateLimitBuckets).where(lt(rateLimitBuckets.windowStart, cutoff)).run();
}

export function sqliteRateLimit(options: RateLimitOptions) {
  const { timeFrame, limit, onLimitExceeded } = options;

  return async (ctx: Context, next: NextFunction): Promise<void> => {
    const telegramId = ctx.from?.id?.toString();
    if (!telegramId) return next();

    runCleanup();

    const now = new Date();
    const bucket = db
      .select()
      .from(rateLimitBuckets)
      .where(eq(rateLimitBuckets.telegramId, telegramId))
      .get();

    const windowExpired = !bucket || now.getTime() - bucket.windowStart.getTime() >= timeFrame;

    if (windowExpired) {
      db.insert(rateLimitBuckets)
        .values({ telegramId, windowStart: now, requestCount: 1, updatedAt: now })
        .onConflictDoUpdate({
          target: rateLimitBuckets.telegramId,
          set: { windowStart: now, requestCount: 1, updatedAt: now },
        })
        .run();
      return next();
    }

    if (bucket.requestCount >= limit) {
      return onLimitExceeded(ctx);
    }

    db.update(rateLimitBuckets)
      .set({ requestCount: bucket.requestCount + 1, updatedAt: now })
      .where(eq(rateLimitBuckets.telegramId, telegramId))
      .run();

    return next();
  };
}
