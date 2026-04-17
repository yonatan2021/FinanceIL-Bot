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
  const kb = new InlineKeyboard();
  const categories = getBudgetCategories();

  categories.forEach((cat) => {
    kb.text(cat, `search:category:${encodeURIComponent(cat)}`).row();
  });
  kb.text('⬅️ תפריט ראשי', 'menu:back');

  await ctx.editMessageText('🔍 *חיפוש עסקאות*\n\nבחר קטגוריה:', {
    reply_markup: kb,
  });
});

searchHandlers.callbackQuery(/^search:category:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const category = decodeURIComponent(ctx.match[1]);
  const txns = searchTransactions({ category, limit: 20 });
  const text = txns.length > 0
    ? `🔍 *עסקאות בקטגוריה "${category}"*\n\n${formatTransactionsMessage(txns)}`
    : `אין עסקאות בקטגוריה "${category}"`;
  await ctx.editMessageText(text, { reply_markup: backToMenuKeyboard() });
});

searchHandlers.callbackQuery('menu:export', async (ctx) => {
  await ctx.answerCallbackQuery();
  const txns = getCurrentMonthTransactions();
  const csv = generateCSV(txns);
  const buffer = Buffer.from(csv, 'utf-8');
  const filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;

  await ctx.replyWithDocument(
    new InputFile(buffer, filename),
    { caption: '✅ קובץ הייצוא של עסקאות' }
  );
});

function generateCSV(transactions: Transaction[]): string {
  const headers = ['תאריך', 'תיאור', 'סכום', 'קטגוריה'];
  const rows = transactions.map((t) => [
    formatDateHE(new Date(t.date)),
    `"${t.description}"`,
    t.amount.toString(),
    t.category || 'ללא קטגוריה',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csv;
}
