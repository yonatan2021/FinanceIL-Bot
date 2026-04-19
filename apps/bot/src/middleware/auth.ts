import type { MiddlewareFn } from 'grammy';
import { eq } from 'drizzle-orm';
import { db } from '@finance-bot/db';
import { allowedUsers } from '@finance-bot/db/schema';
import type { BotContext } from '../types.js';
import { logger } from '../lib/logger.js';

const _rawInterval = Number(process.env.AUTH_LASTSEEN_INTERVAL_MS);
const AUTH_LASTSEEN_INTERVAL_MS = Number.isFinite(_rawInterval) && _rawInterval >= 0
  ? _rawInterval
  : 300_000;

// telegramId → timestamp of last lastSeenAt DB write
const lastSeenCache = new Map<string, number>();

export const authMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const telegramId = String(chatId);

  // This throws on DB failure → propagates to bot.catch (correct)
  const user = db
    .select()
    .from(allowedUsers)
    .where(eq(allowedUsers.telegramId, telegramId))
    .get();

  if (!user || !user.isActive) {
    logger.warn({ action: 'auth_unauthorized', telegramId });
    return;
  }

  ctx.user = user;

  // Fire-and-forget lastSeenAt — write failure is non-fatal
  const now = Date.now();
  const lastWritten = lastSeenCache.get(telegramId);
  if (!lastWritten || now - lastWritten > AUTH_LASTSEEN_INTERVAL_MS) {
    lastSeenCache.set(telegramId, now);
    Promise.resolve()
      .then(() => {
        db.update(allowedUsers)
          .set({ lastSeenAt: new Date() })
          .where(eq(allowedUsers.id, user.id))
          .run();
      })
      .catch((err: Error) => {
        logger.error({ action: 'lastseen_update_failed', telegramId, errorMessage: err.message });
      });
  }

  return next();
};
