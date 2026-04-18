import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env') });
import { Bot } from 'grammy';
import { autoRetry } from '@grammyjs/auto-retry';
import type { ScheduledTask } from 'node-cron';
import { eq, and } from 'drizzle-orm';
import { db } from '@finance-bot/db';
import { allowedUsers } from '@finance-bot/db/schema';
import type { BotContext } from './types.js';
import { authMiddleware } from './middleware/auth.js';
import { menuHandlers } from './handlers/menu.js';
import { dataHandlers } from './handlers/data.js';
import { adminHandlers } from './handlers/admin.js';
import { searchHandlers } from './handlers/search.js';
import { startScheduler } from './scheduler.js';
import { logger } from './lib/logger.js';

const token = process.env.BOT_TOKEN;
if (!token) throw new Error('BOT_TOKEN environment variable is required');

const bot = new Bot<BotContext>(token);

// Handle Telegram 429 and 5xx via @grammyjs/auto-retry (3 retries, exponential backoff).
// The 50ms per-send delay in scheduler.ts provides additional headroom.
bot.api.config.use(autoRetry());

// Inject MarkdownV2 as default parse_mode for all API calls
bot.api.config.use((prev, method, payload, signal) =>
  prev(method, { parse_mode: 'MarkdownV2' as const, ...(payload as object) } as typeof payload, signal)
);

// Dev-only: log raw message text when Telegram rejects MarkdownV2 formatting
if (process.env.NODE_ENV === 'development') {
  bot.api.config.use(async (prev, method, payload, signal) => {
    try {
      return await prev(method, payload, signal);
    } catch (err) {
      if (method === 'sendMessage' || method === 'editMessageText') {
        const text = (payload as Record<string, unknown>)['text'];
        logger.error({ action: 'markdownv2_error', method, textPreview: String(text ?? '').slice(0, 200) });
      }
      throw err;
    }
  });
}

bot.use(authMiddleware);
bot.use(menuHandlers);
bot.use(dataHandlers);
bot.use(adminHandlers);
bot.use(searchHandlers);

bot.catch(async (err) => {
  logger.error({
    action: 'handler_error',
    error: (err.error as Error).message ?? String(err.error),
    telegramId: err.ctx.from?.id,
  });
  try {
    await err.ctx.reply('אירעה שגיאה. אנא נסה שנית מאוחר יותר.');
  } catch (replyErr) {
    logger.error({
      action: 'error_reply_failed',
      error: (replyErr as Error).message,
      telegramId: err.ctx.from?.id,
    });
  }
});

const schedulerTasks: ScheduledTask[] = startScheduler(bot);

const shutdown = async (): Promise<void> => {
  schedulerTasks.forEach((t) => t.stop());
  await bot.stop();
};
process.once('SIGINT', () => void shutdown());
process.once('SIGTERM', () => void shutdown());

const standardCommands = [
  { command: 'start', description: 'פתח את התפריט הראשי' },
  { command: 'menu', description: 'תפריט ראשי' },
  { command: 'help', description: 'רשימת כל הפקודות' },
  { command: 'status', description: 'Dashboard מהיר' },
  { command: 'recent', description: '5 עסקאות אחרונות' },
] as const;

const adminCommands = [
  ...standardCommands,
  { command: 'admin', description: '⚙️ פאנל ניהול (אדמין בלבד)' },
] as const;

// Set default scope for all users
await bot.api.setMyCommands(standardCommands, { scope: { type: 'default' } });

// Set scoped commands for each admin
try {
  const admins = db.select({ telegramId: allowedUsers.telegramId })
    .from(allowedUsers)
    .where(and(eq(allowedUsers.role, 'admin'), eq(allowedUsers.isActive, true)))
    .all();

  for (const admin of admins) {
    await bot.api.setMyCommands(
      adminCommands,
      { scope: { type: 'chat', chat_id: admin.telegramId } },
    );
  }

  logger.info({ action: 'commands_registered', adminCount: admins.length });
} catch (err) {
  logger.error({ action: 'admin_commands_failed', errorCode: (err as NodeJS.ErrnoException).code });
}

bot.start();
logger.info({ action: 'polling_started' });
