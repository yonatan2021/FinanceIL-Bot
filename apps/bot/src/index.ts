import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env') });
import { Bot, GrammyError, HttpError } from 'grammy';
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

// @grammyjs/parse-mode v2 removed the parseMode middleware — replicate with a transformer
bot.api.config.use((prev, method, payload, signal) =>
  prev(method, { parse_mode: 'MarkdownV2', ...payload }, signal)
);

bot.use(authMiddleware);
bot.use(menuHandlers);
bot.use(dataHandlers);
bot.use(adminHandlers);
bot.use(searchHandlers);

bot.catch(async (err) => {
  const ctx = err.ctx;
  console.error(`[bot] error on update ${ctx.update.update_id}:`, err.error);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error('[bot] Telegram API error:', e.description);
  } else if (e instanceof HttpError) {
    console.error('[bot] HTTP error:', e);
  } else {
    console.error('[bot] unknown error:', e);
  }
  try {
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({ text: 'אירעה שגיאה. נסה שוב.' }).catch(() => {});
    }
    await ctx.reply('אירעה שגיאה לא צפויה. נסה שוב מאוחר יותר.');
  } catch (replyErr) {
    console.error('[bot] failed to send error reply:', replyErr);
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
