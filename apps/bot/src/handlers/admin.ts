import { Composer } from 'grammy';
import type { BotContext } from '../types.js';
import { getAllUsers, getLatestScrapeLog, invalidateAfterScrape } from '../queries.js';
import { formatUsersMessage, formatScrapeLogMessage } from '../formatters.js';
import { adminMenuKeyboard } from '../keyboards.js';
import { logger } from '../lib/logger.js';

export const adminHandlers = new Composer<BotContext>();

function isAdmin(ctx: BotContext): boolean {
  return ctx.user!.role === 'admin';
}

adminHandlers.callbackQuery('admin:scraper', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.answerCallbackQuery({ text: 'אין הרשאה.' });
    return;
  }
  await ctx.answerCallbackQuery();
  await ctx.editMessageText('🔄 מפעיל סקרייפר...', { reply_markup: adminMenuKeyboard() });

  try {
    const webUrl = process.env.WEB_INTERNAL_URL ?? 'http://web:5200';
    const res = await fetch(`${webUrl}/api/scrape`, {
      method: 'POST',
      headers: { 'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '' },
    });
    if (!res.ok) {
      logger.error({ action: 'scraper_api_failed', status: res.status });
    }
    if (res.ok) {
      invalidateAfterScrape();
    }
    const resultText = res.ok
      ? '✅ הסקרייפר הושלם בהצלחה.'
      : `❌ שגיאה: סטטוס ${res.status}`;
    await ctx.editMessageText(`🔄 ${resultText}`, { reply_markup: adminMenuKeyboard() });
  } catch (err) {
    logger.error({ action: 'scraper_trigger_failed', errorCode: (err as NodeJS.ErrnoException).code });
    await ctx.editMessageText('❌ שגיאת חיבור לשרת.', { reply_markup: adminMenuKeyboard() });
  }
});

adminHandlers.callbackQuery('admin:users', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.answerCallbackQuery({ text: 'אין הרשאה.' });
    return;
  }
  await ctx.answerCallbackQuery();
  const users = getAllUsers();
  const text = formatUsersMessage(users);
  await ctx.editMessageText(`👥 *משתמשים*\n\n${text}`, {
    reply_markup: adminMenuKeyboard(),
  });
});

adminHandlers.callbackQuery('admin:logs', async (ctx) => {
  if (!isAdmin(ctx)) {
    await ctx.answerCallbackQuery({ text: 'אין הרשאה.' });
    return;
  }
  await ctx.answerCallbackQuery();
  const log = getLatestScrapeLog();
  const text = formatScrapeLogMessage(log);
  await ctx.editMessageText(`📋 *לוג אחרון*\n\n${text}`, {
    reply_markup: adminMenuKeyboard(),
  });
});
