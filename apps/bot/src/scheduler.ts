import cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import type { Bot } from 'grammy';
import type { BotContext } from './types.js';
import { db } from '@finance-bot/db';
import { schedulerState, outboxMessages } from '@finance-bot/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
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
import { openDashboardButton } from './keyboards.js';
import { logger } from './lib/logger.js';

function isSilent(jobName: string): boolean {
  const silentDefault = process.env.SCHEDULER_SILENT_DEFAULT === 'true';
  try {
    const row = db.select({ silentNotifications: schedulerState.silentNotifications })
      .from(schedulerState)
      .where(eq(schedulerState.jobName, jobName))
      .get();
    return row?.silentNotifications ?? silentDefault;
  } catch {
    return silentDefault;
  }
}

function enqueueMessages(
  telegramIds: string[],
  message: string,
  options: { disable_notification?: boolean } = {},
  batchId: string = randomUUID(),
): void {
  if (telegramIds.length === 0) return;
  const now = new Date();
  const rows = telegramIds.map((id) => ({
    telegramId: id,
    text: message,
    parseMode: 'MarkdownV2',
    disableNotification: options.disable_notification ?? false,
    status: 'pending' as const,
    attempts: 0,
    maxAttempts: 5,
    sendAfter: now,
    batchId,
    createdAt: now,
  }));
  db.insert(outboxMessages).values(rows).run();
  logger.info({ action: 'outbox_enqueued', count: rows.length, batchId });
}

function sendDailyBudgetAlerts(): void {
  const activeBudgets = getActiveBudgets();
  const txns = getCurrentMonthTransactions();
  const spending = buildSpending(txns);
  const exceeded = activeBudgets.filter((b) => {
    const spent = spending[b.categoryName] ?? 0;
    const threshold = b.alertThreshold ?? 0.8;
    return b.monthlyLimit > 0 && spent / b.monthlyLimit >= threshold;
  });
  if (exceeded.length === 0) return;

  const silent = isSilent('daily-budget-alerts');
  const adminIds = getAdminUsers().map((u) => u.telegramId);
  const message = `⚠️ *התראת תקציב יומית*\n\n${formatBudgetMessage(exceeded, spending)}`;
  enqueueMessages(adminIds, message, { disable_notification: silent });
}

function sendWeeklySummary(): void {
  const users = getAllUsers();
  const accountRows = getAllAccountsWithBank();
  const txns = getCurrentMonthTransactions();
  const activeBudgets = getActiveBudgets();
  const spending = buildSpending(txns);
  const balancesText = formatBalancesMessage(accountRows);
  const summaryText = formatSummaryMessage(spending, activeBudgets);
  const message = `📊 *סיכום שבועי*\n\n*יתרות:*\n${balancesText}\n\n*הוצאות החודש:*\n${summaryText}`;
  const replyMarkupJson = JSON.stringify(openDashboardButton());

  const silent = isSilent('weekly-summary');
  const now = new Date();
  const batchId = randomUUID();

  const rows = users.map((user) => ({
    telegramId: user.telegramId,
    text: message,
    parseMode: 'MarkdownV2',
    disableNotification: silent,
    replyMarkupJson,
    status: 'pending' as const,
    attempts: 0,
    maxAttempts: 5,
    sendAfter: now,
    batchId,
    createdAt: now,
  }));

  if (rows.length === 0) return;
  db.insert(outboxMessages).values(rows).run();
  logger.info({ action: 'outbox_enqueued', count: rows.length, batchId, job: 'weekly-summary' });
}

function sendMonthlySummary(): void {
  const users = getAllUsers();
  const activeBudgets = getActiveBudgets();
  const txns = getCurrentMonthTransactions();
  const activeUsers = users.filter((u) => u.isActive);
  const spending = buildSpending(txns);
  const message = `📈 *סיכום חודשי*\n\n${formatBudgetMessage(activeBudgets, spending)}`;

  const silent = isSilent('monthly-report');
  enqueueMessages(activeUsers.map((u) => u.telegramId), message, { disable_notification: silent });
}

export function startScheduler(_bot: Bot<BotContext>): ScheduledTask[] {
  const daily = cron.schedule('0 8 * * *', () => {
    try {
      sendDailyBudgetAlerts();
    } catch (err) {
      logger.error({ action: 'daily_alert_failed', errorMessage: (err as Error).message });
    }
  }, { timezone: 'Asia/Jerusalem' });

  const weekly = cron.schedule('0 8 * * 0', () => {
    try {
      sendWeeklySummary();
    } catch (err) {
      logger.error({ action: 'weekly_summary_failed', errorMessage: (err as Error).message });
    }
  }, { timezone: 'Asia/Jerusalem' });

  const monthly = cron.schedule('0 8 1 * *', () => {
    try {
      sendMonthlySummary();
    } catch (err) {
      logger.error({ action: 'monthly_summary_failed', errorMessage: (err as Error).message });
    }
  }, { timezone: 'Asia/Jerusalem' });

  logger.info({ action: 'scheduler_registered', jobs: ['daily_alerts', 'weekly_summary', 'monthly_summary'] });
  return [daily, weekly, monthly];
}
