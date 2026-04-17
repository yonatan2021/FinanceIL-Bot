import { Composer } from 'grammy';
import type { BotContext } from '../types.js';
import { mainMenuKeyboard, adminMenuKeyboard } from '../keyboards.js';

export const menuHandlers = new Composer<BotContext>();

async function showMainMenu(ctx: BotContext): Promise<void> {
  await ctx.reply('תפריט ראשי:', { reply_markup: mainMenuKeyboard(ctx.user!) });
}

menuHandlers.command(['start', 'menu'], (ctx) => showMainMenu(ctx));

menuHandlers.callbackQuery('menu:back', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText('תפריט ראשי:', {
    reply_markup: mainMenuKeyboard(ctx.user!),
  });
});

menuHandlers.callbackQuery('menu:settings', async (ctx) => {
  if (ctx.user!.role !== 'admin') {
    await ctx.answerCallbackQuery({ text: 'אין לך הרשאה לפאנל זה.' });
    return;
  }
  await ctx.answerCallbackQuery();
  await ctx.editMessageText('🔧 תפריט ניהול:', { reply_markup: adminMenuKeyboard() });
});
