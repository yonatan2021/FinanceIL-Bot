import { InlineKeyboard } from 'grammy';
import type { AllowedUser } from '@finance-bot/types';

export function mainMenuKeyboard(user: AllowedUser): InlineKeyboard {
  const kb = new InlineKeyboard()
    .text('💰 יתרות', 'menu:balances')
    .text('📊 סיכום חודשי', 'menu:summary')
    .row()
    .text('📋 עסקאות אחרונות', 'menu:transactions')
    .text('📈 תקציב', 'menu:budget');

  if (user.role === 'admin') {
    kb.row().text('⚙️ הגדרות', 'menu:settings');
  }

  return kb;
}

export function adminMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('🔄 סקרייפר ידני', 'admin:scraper')
    .row()
    .text('👥 משתמשים', 'admin:users')
    .row()
    .text('📋 לוג אחרון', 'admin:logs')
    .row()
    .text('⬅️ חזרה לתפריט', 'menu:back');
}

export function backToMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('⬅️ תפריט ראשי', 'menu:back');
}

export function transactionPageKeyboard(page: number, totalPages: number): InlineKeyboard {
  const kb = new InlineKeyboard();
  if (page > 1) kb.text('◀️', `transactions:page:${page - 1}`);
  kb.text(`${page}/${totalPages}`, 'noop');
  if (page < totalPages) kb.text('▶️', `transactions:page:${page + 1}`);
  kb.row().text('⬅️ תפריט ראשי', 'menu:back');
  return kb;
}
