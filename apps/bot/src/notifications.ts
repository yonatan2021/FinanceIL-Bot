import type { Bot } from 'grammy';
import { getAdminUsers } from './queries.js';
import { logger } from './lib/logger.js';

async function sendToAdmins(bot: Bot, message: string): Promise<void> {
  const admins = getAdminUsers();
  for (const admin of admins) {
    try {
      await bot.api.sendMessage(admin.telegramId, message, { parse_mode: 'MarkdownV2' });
    } catch (err) {
      logger.error({ action: 'notify_admin_failed', telegramId: admin.telegramId, errorMessage: (err as Error).message });
    }
  }
}

function escape(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

export async function sendBudgetAlert(
  bot: Bot,
  category: string,
  spent: number,
  limit: number,
): Promise<void> {
  const msg = `⚠️ חריגה בתקציב\n*${escape(category)}*: הוצאת ₪${spent} מתוך ₪${limit}`;
  await sendToAdmins(bot, msg);
}

export async function sendScrapeError(
  bot: Bot,
  bankName: string,
  errorMessage: string,
): Promise<void> {
  const msg = `🔴 שגיאה במשיכת נתונים מ\\-${escape(bankName)}\n\`${escape(errorMessage)}\`\nנדרשת התערבות\\.`;
  await sendToAdmins(bot, msg);
}

export async function sendScrapeSuccess(
  bot: Bot,
  bankName: string,
  count: number,
): Promise<void> {
  const msg = `✅ עודכנו ${count} עסקאות חדשות מ\\-${escape(bankName)}`;
  await sendToAdmins(bot, msg);
}
