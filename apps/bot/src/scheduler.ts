import cron from 'node-cron';
import type { Bot } from 'grammy';
import type { BotContext } from './types.js';
import {
  getActiveBudgets,
  getCurrentMonthTransactions,
  getAllAccountsWithBank,
  getAdminUsers,
  getAllUsers,
} from './queries.js';
import {
  formatBudgetMessage,
  formatBalancesMessage,
  formatSummaryMessage,
} from './formatters.js';
import { buildSpending } from './helpers.js';

async function sendToAll(bot: Bot<BotContext>, telegramIds: string[], message: string): Promise<void> {
  for (const id of telegramIds) {
    try {
      await bot.api.sendMessage(id, message);
    } catch (err) {
      console.error(`[scheduler] failed to send to ${id}:`, err);
    }
  }
}

async function sendDailyBudgetAlerts(bot: Bot<BotContext>): Promise<void> {
  const budgets = getActiveBudgets();
  const txns = getCurrentMonthTransactions();
  const spending = buildSpending(txns);
  const exceeded = budgets.filter((b) => {
    const spent = spending[b.categoryName] ?? 0;
    const threshold = b.alertThreshold ?? 0.8;
    return b.monthlyLimit > 0 && spent / b.monthlyLimit >= threshold;
  });
  if (exceeded.length === 0) return;

  const adminIds = getAdminUsers().map((u) => u.telegramId);
  const message = `⚠️ *התראת תקציב יומית*\n\n${formatBudgetMessage(exceeded, spending)}`;
  await sendToAll(bot, adminIds, message);
}

async function sendWeeklySummary(bot: Bot<BotContext>): Promise<void> {
  const users = getAllUsers().filter((u) => u.isActive);
  const accounts = getAllAccountsWithBank();
  const txns = getCurrentMonthTransactions();
  const budgets = getActiveBudgets();
  const spending = buildSpending(txns);
  const balancesText = formatBalancesMessage(accounts);
  const summaryText = formatSummaryMessage(spending, budgets);
  const message = `📊 *סיכום שבועי*\n\n*יתרות:*\n${balancesText}\n\n*הוצאות החודש:*\n${summaryText}`;
  await sendToAll(bot, users.map((u) => u.telegramId), message);
}

async function sendMonthlySummary(bot: Bot<BotContext>): Promise<void> {
  const users = getAllUsers().filter((u) => u.isActive);
  const budgets = getActiveBudgets();
  const txns = getCurrentMonthTransactions();
  const spending = buildSpending(txns);
  const message = `📈 *סיכום חודשי*\n\n${formatBudgetMessage(budgets, spending)}`;
  await sendToAll(bot, users.map((u) => u.telegramId), message);
}

export function startScheduler(bot: Bot<BotContext>): void {
  cron.schedule('0 8 * * *', () => {
    sendDailyBudgetAlerts(bot).catch((err) => console.error('[scheduler] daily alert error:', err));
  }, { timezone: 'Asia/Jerusalem' });

  cron.schedule('0 8 * * 0', () => {
    sendWeeklySummary(bot).catch((err) => console.error('[scheduler] weekly summary error:', err));
  }, { timezone: 'Asia/Jerusalem' });

  cron.schedule('0 8 1 * *', () => {
    sendMonthlySummary(bot).catch((err) => console.error('[scheduler] monthly summary error:', err));
  }, { timezone: 'Asia/Jerusalem' });

  console.error('[scheduler] cron jobs registered (daily alerts, weekly & monthly summaries)');
}
