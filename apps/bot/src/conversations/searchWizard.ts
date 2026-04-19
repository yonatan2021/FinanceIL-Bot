import { InlineKeyboard } from 'grammy';
import type { Conversation } from '@grammyjs/conversations';
import type { BotContext } from '../types.js';
import { searchTransactions, getBudgetCategories } from '../queries.js';
import { formatTransactionsMessage } from '../formatters.js';
import { escapeMarkdownV2 } from '@finance-bot/utils/markdown';
import { logger } from '../lib/logger.js';

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

function parseDateInput(input: string): { date: Date; usedFallback: boolean } {
  const normalized = input.trim().toLowerCase();
  if (normalized === 'חודש אחרון' || normalized === 'last month') {
    return { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), usedFallback: false };
  }
  // Try DD/MM/YYYY
  const match = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const [, d, m, y] = match;
    return { date: new Date(Number(y), Number(m) - 1, Number(d)), usedFallback: false };
  }
  // Default: start of current month
  const now = new Date();
  return { date: new Date(now.getFullYear(), now.getMonth(), 1), usedFallback: true };
}

export async function searchWizard(
  conversation: Conversation<BotContext, BotContext>,
  ctx: BotContext,
): Promise<void> {
  // Step 1: Ask for search query text
  await ctx.reply(
    '🔍 *חיפוש עסקאות*\n\nשלב 1/3: הקלד את שם העסק או תיאור לחיפוש:',
    { parse_mode: 'MarkdownV2' },
  );

  const queryCtx = await conversation.waitFor('message:text', {
    maxMilliseconds: TIMEOUT_MS,
    otherwise: async (c) => {
      await c.reply('נא לשלוח טקסט בלבד.').catch(() => {});
    },
  });
  const searchQuery = queryCtx.message.text.trim();

  // Step 2: Ask for from-date
  await queryCtx.reply(
    'שלב 2/3: מאיזה תאריך לחפש?\nפורמט: DD/MM/YYYY, או שלח "חודש אחרון"',
  );

  const dateCtx = await conversation.waitFor('message:text', {
    maxMilliseconds: TIMEOUT_MS,
    otherwise: async (c) => {
      await c.reply('נא לשלוח תאריך בפורמט DD/MM/YYYY או "חודש אחרון".').catch(() => {});
    },
  });
  const { date: fromDate, usedFallback } = parseDateInput(dateCtx.message.text);
  if (usedFallback) {
    await dateCtx.reply('פורמט תאריך לא זוהה — משתמש בתחילת החודש הנוכחי.').catch(() => {});
  }

  // Step 3: Show category picker
  const categories = await conversation.external(() => getBudgetCategories());

  if (categories.length === 0) {
    await dateCtx.reply('אין קטגוריות פעילות.').catch(() => {});
    return;
  }

  const kb = new InlineKeyboard();
  categories.forEach((cat) => {
    kb.text(cat, `wizard:cat:${encodeURIComponent(cat)}`).row();
  });

  await dateCtx.reply('שלב 3/3: בחר קטגוריה:', {
    reply_markup: kb,
  });

  const catCtx = await conversation.waitForCallbackQuery(/^wizard:cat:.+$/, {
    maxMilliseconds: TIMEOUT_MS,
    otherwise: async (c) => {
      await c.reply('נא לבחור קטגוריה מהרשימה.').catch(() => {});
    },
  });

  await catCtx.answerCallbackQuery({ text: '✓' }).catch(() => {});
  const category = decodeURIComponent(catCtx.callbackQuery.data.replace('wizard:cat:', ''));

  // Execute search — pass keyword, startDate, and category collected from wizard steps
  const txns = await conversation.external(() =>
    searchTransactions({ keyword: searchQuery, startDate: fromDate, category, limit: 20 }),
  );

  logger.info({
    action: 'search_wizard_completed',
    category,
    fromDate: fromDate.toISOString(),
    query: searchQuery,
    resultCount: txns.length,
  });

  if (txns.length === 0) {
    await catCtx.reply(`לא נמצאו עסקאות בקטגוריה "${escapeMarkdownV2(category)}".`, {
      parse_mode: 'MarkdownV2',
    }).catch(() => {});
    return;
  }

  const text = formatTransactionsMessage(txns);
  await catCtx.reply(`🔍 *תוצאות חיפוש — ${escapeMarkdownV2(category)}*\n\n${text}`, {
    parse_mode: 'MarkdownV2',
  }).catch(() => {});
}
