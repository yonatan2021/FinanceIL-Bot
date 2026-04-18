import { Composer, InlineKeyboard, InputFile } from 'grammy';
import type { BotContext } from '../types.js';
import { searchTransactions, getBudgetCategories, getCurrentMonthTransactions } from '../queries.js';
import { formatTransactionsMessage } from '../formatters.js';
import { backToMenuKeyboard } from '../keyboards.js';
import { formatDateHE } from '@finance-bot/utils/dates';
import type { Transaction } from '@finance-bot/types';

export const searchHandlers = new Composer<BotContext>();

searchHandlers.callbackQuery('menu:search', async (ctx) => {
  await ctx.answerCallbackQuery();
  try {
    const categories = getBudgetCategories();

    if (categories.length === 0) {
      await ctx.editMessageText('אין קטגוריות פעילות להצגה.', {
        reply_markup: backToMenuKeyboard(),
      });
      return;
    }

    const kb = new InlineKeyboard();
    categories.forEach((cat) => {
      kb.text(cat, `search:category:${encodeURIComponent(cat)}`).row();
    });
    kb.text('⬅️ תפריט ראשי', 'menu:back');

    await ctx.editMessageText('🔍 *חיפוש עסקאות*\n\nבחר קטגוריה:', {
      reply_markup: kb,
    });
  } catch (err) {
    console.error('[search] failed to load categories:', err);
    await ctx.reply('שגיאה בטעינת הקטגוריות. נסה שוב מאוחר יותר.').catch(() => {});
  }
});

searchHandlers.callbackQuery(/^search:category:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  try {
    const category = decodeURIComponent(ctx.match[1]);
    const knownCategories = getBudgetCategories();
    if (!knownCategories.includes(category)) {
      await ctx.editMessageText('קטגוריה לא תקינה.', { reply_markup: backToMenuKeyboard() });
      return;
    }
    const txns = searchTransactions({ category, limit: 20 });
    const text = txns.length > 0
      ? `🔍 *עסקאות בקטגוריה "${category}"*\n\n${formatTransactionsMessage(txns)}`
      : `אין עסקאות בקטגוריה "${category}"`;
    await ctx.editMessageText(text, { reply_markup: backToMenuKeyboard() });
  } catch (err) {
    console.error('[search] category search failed:', err);
    await ctx.reply('שגיאה בחיפוש. נסה שוב מאוחר יותר.').catch(() => {});
  }
});

searchHandlers.callbackQuery('menu:export', async (ctx) => {
  await ctx.answerCallbackQuery();
  try {
    const txns = getCurrentMonthTransactions();
    if (txns.length === 0) {
      await ctx.reply('אין עסקאות לחודש הנוכחי לייצוא.');
      return;
    }
    const csv = generateCSV(txns);
    const buffer = Buffer.from(csv, 'utf-8');
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    await ctx.replyWithDocument(
      new InputFile(buffer, filename),
      { caption: '✅ קובץ הייצוא של עסקאות' }
    );
  } catch (err) {
    console.error('[export] failed to generate or send CSV:', err);
    await ctx.reply('שגיאה ביצירת הקובץ. נסה שוב מאוחר יותר.').catch(() => {});
  }
});

export function csvEscape(value: string): string {
  // Prevent formula injection: prefix with single quote
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  // Escape embedded double quotes (RFC 4180)
  return `"${safe.replace(/"/g, '""')}"`;
}

export function generateCSV(txnList: Transaction[]): string {
  const headers = ['תאריך', 'תיאור', 'סכום', 'קטגוריה'];
  const rows = txnList.map((t) => [
    formatDateHE(new Date(t.date)),
    csvEscape(t.description),
    t.amount.toString(),
    csvEscape(t.category ?? 'ללא קטגוריה'),
  ]);

  return [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');
}
