import { Composer, InlineKeyboard } from 'grammy';
import type { BotContext } from '../types.js';
import { mainMenuKeyboard, adminMenuKeyboard, backToMenuKeyboard } from '../keyboards.js';
import {
  getRecentTransactions,
  getCurrentMonthTransactions,
  getTotalBalance,
  computeBudgetAlertCount,
  getActiveBudgets,
  getAllAccountsWithBank,
  getTransactionPage,
  getTransactionCount,
  getBudgetCategories,
} from '../queries.js';
import {
  formatHelpMessage,
  formatStatusMessage,
  formatTransactionsMessage,
  formatBalancesMessage,
  formatSummaryMessage,
  formatBudgetMessage,
} from '../formatters.js';
import { buildSpending } from '../helpers.js';
import { logger } from '../lib/logger.js';

export const menuHandlers = new Composer<BotContext>();

async function showMainMenu(ctx: BotContext): Promise<void> {
  await ctx.reply('תפריט ראשי:', { reply_markup: mainMenuKeyboard(ctx.user!) });
}

// --- Reusable display functions (used by both callbacks and deep links) ---

export async function showBalances(ctx: BotContext): Promise<void> {
  const rows = getAllAccountsWithBank();
  const text = formatBalancesMessage(rows);
  await ctx.reply(`💰 *יתרות חשבונות*\n\n${text}`, { reply_markup: backToMenuKeyboard() });
}

export async function showSummary(ctx: BotContext): Promise<void> {
  const txns = getCurrentMonthTransactions();
  const budgets = getActiveBudgets();
  const spending = buildSpending(txns);
  const text = formatSummaryMessage(spending, budgets);
  await ctx.reply(`📊 *סיכום חודשי*\n\n${text}`, { reply_markup: backToMenuKeyboard() });
}

export async function showBudget(ctx: BotContext): Promise<void> {
  const budgets = getActiveBudgets();
  const txns = getCurrentMonthTransactions();
  const spending = buildSpending(txns);
  const text = formatBudgetMessage(budgets, spending);
  await ctx.reply(`📈 *תקציב החודש*\n\n${text}`, { reply_markup: backToMenuKeyboard() });
}

export async function showTransactions(ctx: BotContext): Promise<void> {
  const pageSize = 10;
  const total = getTransactionCount();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const txns = getTransactionPage(1, pageSize);
  const text = `📋 *עסקאות אחרונות* \\(עמוד 1/${totalPages}\\)\n\n${formatTransactionsMessage(txns)}`;
  await ctx.reply(text, { reply_markup: backToMenuKeyboard() });
}

export async function showSearch(ctx: BotContext): Promise<void> {
  try {
    const categories = getBudgetCategories();

    if (categories.length === 0) {
      await ctx.reply('אין קטגוריות פעילות להצגה.', { reply_markup: backToMenuKeyboard() });
      return;
    }

    const kb = new InlineKeyboard();
    categories.forEach((cat) => {
      kb.text(cat, `search:category:${encodeURIComponent(cat)}`).row();
    });
    kb.text('⬅️ תפריט ראשי', 'menu:back');

    await ctx.reply('🔍 *חיפוש עסקאות*\n\nבחר קטגוריה:', { reply_markup: kb });
  } catch (err) {
    logger.error({ action: 'deep_link_search_failed', errorCode: (err as NodeJS.ErrnoException).code });
    await ctx.reply('שגיאה בטעינת הקטגוריות. נסה שוב מאוחר יותר.', { reply_markup: backToMenuKeyboard() });
  }
}

export async function showSettings(ctx: BotContext): Promise<void> {
  if (ctx.user!.role !== 'admin') {
    await ctx.reply('אין לך הרשאה לפאנל זה.', { reply_markup: backToMenuKeyboard() });
    return;
  }
  await ctx.reply('🔧 תפריט ניהול:', { reply_markup: adminMenuKeyboard() });
}

// --- Command handlers ---

menuHandlers.command('start', async (ctx) => {
  const payload = typeof ctx.match === 'string' ? ctx.match.trim() : '';

  if (payload) {
    switch (payload) {
      case 'budget':
        await showBudget(ctx);
        return;
      case 'balances':
        await showBalances(ctx);
        return;
      case 'summary':
        await showSummary(ctx);
        return;
      case 'transactions':
        await showTransactions(ctx);
        return;
      case 'search':
        await showSearch(ctx);
        return;
      case 'settings':
        await showSettings(ctx);
        return;
      default:
        // Unknown payload — fall through to normal start
        break;
    }
  }

  await ctx.reply('תפריט ראשי:', {
    reply_markup: mainMenuKeyboard(ctx.user!),
    reply_parameters: { message_id: ctx.message!.message_id },
  });
});

menuHandlers.command('menu', (ctx) => showMainMenu(ctx));

menuHandlers.callbackQuery('menu:back', async (ctx) => {
  await ctx.answerCallbackQuery({ text: '←' });
  await ctx.editMessageText('תפריט ראשי:', {
    reply_markup: mainMenuKeyboard(ctx.user!),
  });
});

menuHandlers.callbackQuery('menu:settings', async (ctx) => {
  if (ctx.user!.role !== 'admin') {
    await ctx.answerCallbackQuery({ text: 'אין לך הרשאה לפאנל זה.', show_alert: true });
    return;
  }
  await ctx.answerCallbackQuery({ text: '✓' });
  await ctx.editMessageText('🔧 תפריט ניהול:', { reply_markup: adminMenuKeyboard() });
});

menuHandlers.command('help', async (ctx) => {
  await ctx.reply(formatHelpMessage(), {
    reply_parameters: { message_id: ctx.message!.message_id },
  });
});

menuHandlers.command('status', async (ctx) => {
  const totalBalance = getTotalBalance();
  const txns = getCurrentMonthTransactions();
  const activeBudgets = getActiveBudgets();
  const spending = buildSpending(txns);
  const monthSpending = Object.values(spending).reduce((sum, val) => sum + val, 0);
  const alertCount = computeBudgetAlertCount(activeBudgets, spending);
  const text = formatStatusMessage(totalBalance, monthSpending, alertCount);
  await ctx.reply(text, { reply_markup: backToMenuKeyboard() });
});

menuHandlers.command('recent', async (ctx) => {
  const txns = getRecentTransactions(5);
  const text = `📋 *5 עסקאות אחרונות*\n\n${formatTransactionsMessage(txns)}`;
  await ctx.reply(text, { reply_markup: backToMenuKeyboard() });
});
