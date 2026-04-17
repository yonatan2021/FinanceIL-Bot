import 'dotenv/config';
import { Bot, GrammyError, HttpError } from 'grammy';
import { parseMode } from '@grammyjs/parse-mode';
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

bot.api.config.use(parseMode('MarkdownV2'));

bot.use(authMiddleware);
bot.use(menuHandlers);
bot.use(dataHandlers);
bot.use(adminHandlers);
bot.use(searchHandlers);

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`[bot] error on update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error('[bot] Telegram API error:', e.description);
  } else if (e instanceof HttpError) {
    console.error('[bot] HTTP error:', e);
  } else {
    console.error('[bot] unknown error:', e);
  }
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
