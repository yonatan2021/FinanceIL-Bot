import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
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

const SCHEDULER_SEND_DELAY_MS = Number(process.env.SCHEDULER_SEND_DELAY_MS ?? 50);

async function sendToAll(bot: Bot<BotContext>, telegramIds: string[], message: string): Promise<void> {
  for (const id of telegramIds) {
    try {
      await bot.api.sendMessage(id, message);
    } catch (err) {
      console.error(`[scheduler] failed to send to ${id}:`, (err as Error).message);
    }
    await new Promise<void>((resolve) => setTimeout(resolve, SCHEDULER_SEND_DELAY_MS));
  }
}

async function sendDailyBudgetAlerts(bot: Bot<BotContext>): Promise<void> {
  const budgetList = getActiveBudgets();
  const txns = getCurrentMonthTransactions();
  const spending = buildSpending(txns);
  const exceeded = budgetList.filter((b) => {
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
  const accountRows = getAllAccountsWithBank();
  const txns = getCurrentMonthTransactions();
  const budgetList = getActiveBudgets();
  const spending = buildSpending(txns);
  const balancesText = formatBalancesMessage(accountRows);
  const summaryText = formatSummaryMessage(spending, budgetList);
  const message = `📊 *סיכום שבועי*\n\n*יתרות:*\n${balancesText}\n\n*הוצאות החודש:*\n${summaryText}`;
  await sendToAll(bot, users.map((u) => u.telegramId), message);
}

async function sendMonthlySummary(bot: Bot<BotContext>): Promise<void> {
  const users = getAllUsers().filter((u) => u.isActive);
  const budgetList = getActiveBudgets();
  const txns = getCurrentMonthTransactions();
  const spending = buildSpending(txns);
  const message = `📈 *סיכום חודשי*\n\n${formatBudgetMessage(budgetList, spending)}`;
  await sendToAll(bot, users.map((u) => u.telegramId), message);
}

export function startScheduler(bot: Bot<BotContext>): ScheduledTask[] {
  const daily = cron.schedule('0 8 * * *', () => {
    sendDailyBudgetAlerts(bot).catch((err) => console.error('[scheduler] daily alert error:', err));
  }, { timezone: 'Asia/Jerusalem' });

  const weekly = cron.schedule('0 8 * * 0', () => {
    sendWeeklySummary(bot).catch((err) => console.error('[scheduler] weekly summary error:', err));
  }, { timezone: 'Asia/Jerusalem' });

  const monthly = cron.schedule('0 8 1 * *', () => {
    sendMonthlySummary(bot).catch((err) => console.error('[scheduler] monthly summary error:', err));
  }, { timezone: 'Asia/Jerusalem' });

  console.error('[scheduler] cron jobs registered (daily alerts, weekly & monthly summaries)');
  return [daily, weekly, monthly];
}
