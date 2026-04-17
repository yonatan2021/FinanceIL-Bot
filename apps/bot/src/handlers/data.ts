import { Composer, InlineKeyboard } from 'grammy';
import type { BotContext } from '../types.js';
import {
  getAllAccountsWithBank,
  getRecentTransactions,
  getCurrentMonthTransactions,
  getActiveBudgets,
  getTransactionPage,
  getTransactionCount,
} from '../queries.js';
import {
  formatBalancesMessage,
  formatTransactionsMessage,
  formatSummaryMessage,
  formatBudgetMessage,
} from '../formatters.js';
import { backToMenuKeyboard, transactionPageKeyboard } from '../keyboards.js';
import { buildSpending } from '../helpers.js';

export const dataHandlers = new Composer<BotContext>();

dataHandlers.callbackQuery('menu:balances', async (ctx) => {
  await ctx.answerCallbackQuery();
  const rows = getAllAccountsWithBank();
  const text = formatBalancesMessage(rows);
  await ctx.editMessageText(`💰 *יתרות חשבונות*\n\n${text}`, {
    reply_markup: backToMenuKeyboard(),
  });
});

dataHandlers.callbackQuery('menu:summary', async (ctx) => {
  await ctx.answerCallbackQuery();
  const txns = getCurrentMonthTransactions();
  const budgets = getActiveBudgets();
  const spending = buildSpending(txns);
  const text = formatSummaryMessage(spending, budgets);
  await ctx.editMessageText(`📊 *סיכום חודשי*\n\n${text}`, {
    reply_markup: backToMenuKeyboard(),
  });
});

function buildTransactionsPage(page: number): { text: string; keyboard: InlineKeyboard } {
  const pageSize = 10;
  const total = getTransactionCount();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const txns = getTransactionPage(currentPage, pageSize);
  const text = `📋 *עסקאות אחרונות* \\(עמוד ${currentPage}/${totalPages}\\)\n\n${formatTransactionsMessage(txns)}`;
  return { text, keyboard: transactionPageKeyboard(currentPage, totalPages) };
}

dataHandlers.callbackQuery('menu:transactions', async (ctx) => {
  await ctx.answerCallbackQuery();
  const { text, keyboard } = buildTransactionsPage(1);
  await ctx.editMessageText(text, { reply_markup: keyboard });
});

dataHandlers.callbackQuery(/^transactions:page:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const page = parseInt(ctx.match[1], 10);
  const { text, keyboard } = buildTransactionsPage(page);
  await ctx.editMessageText(text, { reply_markup: keyboard });
});

dataHandlers.callbackQuery('noop', async (ctx) => {
  await ctx.answerCallbackQuery();
});

dataHandlers.callbackQuery('menu:budget', async (ctx) => {
  await ctx.answerCallbackQuery();
  const budgets = getActiveBudgets();
  const txns = getCurrentMonthTransactions();
  const spending = buildSpending(txns);
  const text = formatBudgetMessage(budgets, spending);
  await ctx.editMessageText(`📈 *תקציב החודש*\n\n${text}`, {
    reply_markup: backToMenuKeyboard(),
  });
});
