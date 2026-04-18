import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env') });
import { Bot } from 'grammy';
import type { BotContext } from './types.js';
import { authMiddleware } from './middleware/auth.js';
import { menuHandlers } from './handlers/menu.js';
import { dataHandlers } from './handlers/data.js';
import { adminHandlers } from './handlers/admin.js';
import { searchHandlers } from './handlers/search.js';
import { startScheduler } from './scheduler.js';

const token = process.env.BOT_TOKEN;
if (!token) throw new Error('BOT_TOKEN environment variable is required');

const bot = new Bot<BotContext>(token);

bot.api.config.use((prev, method, payload, signal) =>
  prev(method, { parse_mode: 'MarkdownV2' as const, ...(payload as object) } as typeof payload, signal)
);

bot.use(authMiddleware);
bot.use(menuHandlers);
bot.use(dataHandlers);
bot.use(adminHandlers);
bot.use(searchHandlers);

bot.catch(async (err) => {
  console.error('[bot.catch]', err.error);
  try {
    await err.ctx.reply('אירעה שגיאה. אנא נסה שנית מאוחר יותר.');
  } catch { /* ignore reply failure */ }
});

process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());

startScheduler(bot);

await bot.api.setMyCommands([
  { command: 'start', description: 'פתח את התפריט הראשי' },
  { command: 'menu', description: 'תפריט ראשי' },
  { command: 'help', description: 'רשימת כל הפקודות' },
  { command: 'status', description: 'Dashboard מהיר' },
  { command: 'recent', description: '5 עסקאות אחרונות' },
]);
console.error('[bot] commands registered');

bot.start();
console.error('[bot] polling started');
