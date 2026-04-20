import { Composer } from 'grammy';
import type { BotContext } from '../types.js';
import { getAllUsers, getLatestScrapeLog } from '../queries.js';
import { formatUsersMessage, formatScrapeLogMessage } from '../formatters.js';
import { adminMenuKeyboard } from '../keyboards.js';
import { logger } from '../lib/logger.js';
import { db } from '@finance-bot/db';
import { jobQueue } from '@finance-bot/db/schema';

export const adminHandlers = new Composer<BotContext>();

function isAdmin(ctx: BotContext): boolean {
  return ctx.user!.role === 'admin';
}

adminHandlers.callbackQuery('admin:scraper', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.answerCallbackQuery({ text: 'אין הרשאה.', show_alert: true });
    return;
  }
  await ctx.answerCallbackQuery({ text: 'בתור...' });

  const now = new Date();
  db.insert(jobQueue).values({
    type: 'scrape_all',
    payload: JSON.stringify({ triggeredBy: 'admin' }),
    status: 'pending',
    runAfter: now,
    attempts: 0,
    maxAttempts: 3,
    createdAt: now,
  }).run();

  logger.info({ action: 'scraper_job_enqueued', triggeredBy: ctx.user?.telegramId });
  await ctx.editMessageText(
    '🔄 הסקרייפר בתור לריצה\\. תקבל הודעה בסיום\\.',
    { reply_markup: adminMenuKeyboard() },
  );
});

adminHandlers.callbackQuery('admin:users', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.answerCallbackQuery({ text: 'אין הרשאה.', show_alert: true });
    return;
  }
  await ctx.answerCallbackQuery({ text: '✓' });
  const users = getAllUsers();
  const text = formatUsersMessage(users);
  await ctx.editMessageText(`👥 *משתמשים*\n\n${text}`, {
    reply_markup: adminMenuKeyboard(),
  });
});

adminHandlers.callbackQuery('admin:logs', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.answerCallbackQuery({ text: 'אין הרשאה.', show_alert: true });
    return;
  }
  await ctx.answerCallbackQuery({ text: '✓' });
  const log = getLatestScrapeLog();
  const text = formatScrapeLogMessage(log);
  await ctx.editMessageText(`📋 *לוג אחרון*\n\n${text}`, {
    reply_markup: adminMenuKeyboard(),
  });
});
