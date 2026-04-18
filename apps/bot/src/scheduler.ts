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
import { logger } from './lib/logger.js';

const _rawDelay = Number(process.env.SCHEDULER_SEND_DELAY_MS);
const SCHEDULER_SEND_DELAY_MS = Number.isFinite(_rawDelay) && _rawDelay >= 0 ? _rawDelay : 50;

async function sendToAll(bot: Bot<BotContext>, telegramIds: string[], message: string): Promise<void> {
  for (const id of telegramIds) {
    try {
      await bot.api.sendMessage(id, message);
    } catch (err) {
      logger.error({ action: 'scheduler_send_failed', telegramId: id, errorMessage: (err as Error).message });
    }
    await new Promise<void>((resolve) => setTimeout(resolve, SCHEDULER_SEND_DELAY_MS));
  }
}

async function sendDailyBudgetAlerts(bot: Bot<BotContext>): Promise<void> {
  const activeBudgets = getActiveBudgets();
  const txns = getCurrentMonthTransactions();
  const spending = buildSpending(txns);
  const exceeded = activeBudgets.filter((b) => {
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
  const users = getAllUsers();
  const accountRows = getAllAccountsWithBank();
  const txns = getCurrentMonthTransactions();
  const activeBudgets = getActiveBudgets();
  const activeUsers = users.filter((u) => u.isActive);
  const spending = buildSpending(txns);
  const balancesText = formatBalancesMessage(accountRows);
  const summaryText = formatSummaryMessage(spending, activeBudgets);
  const message = `📊 *סיכום שבועי*\n\n*יתרות:*\n${balancesText}\n\n*הוצאות החודש:*\n${summaryText}`;
  await sendToAll(bot, activeUsers.map((u) => u.telegramId), message);
}

async function sendMonthlySummary(bot: Bot<BotContext>): Promise<void> {
  const users = getAllUsers();
  const activeBudgets = getActiveBudgets();
  const txns = getCurrentMonthTransactions();
  const activeUsers = users.filter((u) => u.isActive);
  const spending = buildSpending(txns);
  const message = `📈 *סיכום חודשי*\n\n${formatBudgetMessage(activeBudgets, spending)}`;
  await sendToAll(bot, activeUsers.map((u) => u.telegramId), message);
}

export function startScheduler(bot: Bot<BotContext>): ScheduledTask[] {
  const daily = cron.schedule('0 8 * * *', () => {
    sendDailyBudgetAlerts(bot).catch((err) => logger.error({ action: 'daily_alert_failed', errorMessage: (err as Error).message }));
  }, { timezone: 'Asia/Jerusalem' });

  const weekly = cron.schedule('0 8 * * 0', () => {
    sendWeeklySummary(bot).catch((err) => logger.error({ action: 'weekly_summary_failed', errorMessage: (err as Error).message }));
  }, { timezone: 'Asia/Jerusalem' });

  const monthly = cron.schedule('0 8 1 * *', () => {
    sendMonthlySummary(bot).catch((err) => logger.error({ action: 'monthly_summary_failed', errorMessage: (err as Error).message }));
  }, { timezone: 'Asia/Jerusalem' });

  logger.info({ action: 'scheduler_registered', jobs: ['daily_alerts', 'weekly_summary', 'monthly_summary'] });
  return [daily, weekly, monthly];
}
