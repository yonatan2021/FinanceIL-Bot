import type { MiddlewareFn } from 'grammy';
import { eq } from 'drizzle-orm';
import { db } from '@finance-bot/db';
import { allowedUsers } from '@finance-bot/db/schema';
import type { BotContext } from '../types.js';

export const authMiddleware: MiddlewareFn<BotContext> = async (ctx, next) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const telegramId = String(chatId);
  const user = db
    .select()
    .from(allowedUsers)
    .where(eq(allowedUsers.telegramId, telegramId))
    .get();

  if (!user || !user.isActive) {
    console.log(`[auth] unauthorized access from chat_id=${telegramId}`);
    return;
  }

  db.update(allowedUsers)
    .set({ lastSeenAt: new Date() })
    .where(eq(allowedUsers.id, user.id))
    .run();

  ctx.user = user;
  return next();
};
