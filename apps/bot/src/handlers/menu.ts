import { Composer } from 'grammy';
import type { BotContext } from '../types.js';
import { mainMenuKeyboard, adminMenuKeyboard, backToMenuKeyboard } from '../keyboards.js';
import {
  getRecentTransactions,
  getCurrentMonthTransactions,
  getTotalBalance,
  getBudgetAlertCount,
  getActiveBudgets,
} from '../queries.js';
import {
  formatHelpMessage,
  formatStatusMessage,
  formatTransactionsMessage,
} from '../formatters.js';
import { buildSpending } from '../helpers.js';

export const menuHandlers = new Composer<BotContext>();

async function showMainMenu(ctx: BotContext): Promise<void> {
  await ctx.reply('תפריט ראשי:', { reply_markup: mainMenuKeyboard(ctx.user!) });
}

menuHandlers.command(['start', 'menu'], (ctx) => showMainMenu(ctx));

menuHandlers.callbackQuery('menu:back', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText('תפריט ראשי:', {
    reply_markup: mainMenuKeyboard(ctx.user!),
  });
});

menuHandlers.callbackQuery('menu:settings', async (ctx) => {
  if (ctx.user!.role !== 'admin') {
    await ctx.answerCallbackQuery({ text: 'אין לך הרשאה לפאנל זה.' });
    return;
  }
  await ctx.answerCallbackQuery();
  await ctx.editMessageText('🔧 תפריט ניהול:', { reply_markup: adminMenuKeyboard() });
});

menuHandlers.command('help', async (ctx) => {
  await ctx.reply(formatHelpMessage());
});

menuHandlers.command('status', async (ctx) => {
  const totalBalance = getTotalBalance();
  const txns = getCurrentMonthTransactions();
  const spending = buildSpending(txns);
  const monthSpending = Object.values(spending).reduce((sum, val) => sum + val, 0);
  const alertCount = getBudgetAlertCount();
  const text = formatStatusMessage(totalBalance, monthSpending, alertCount);
  await ctx.reply(text, { reply_markup: backToMenuKeyboard() });
});

menuHandlers.command('recent', async (ctx) => {
  const txns = getRecentTransactions(5);
  const text = `📋 *5 עסקאות אחרונות*\n\n${formatTransactionsMessage(txns)}`;
  await ctx.reply(text, { reply_markup: backToMenuKeyboard() });
});
