import { InlineKeyboard } from 'grammy';
import type { InlineKeyboardButton } from '@grammyjs/types';
import type { AllowedUser } from '@finance-bot/types';

export function openDashboardButton(): InlineKeyboardButton.UrlButton {
  const url = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return InlineKeyboard.url('📊 פתח דשבורד', url);
}

export function mainMenuKeyboard(user: AllowedUser): InlineKeyboard {
  const kb = new InlineKeyboard()
    .text('💰 יתרות', 'menu:balances')
    .text('📊 סיכום חודשי', 'menu:summary')
    .row()
    .text('📋 עסקאות אחרונות', 'menu:transactions')
    .text('📈 תקציב', 'menu:budget')
    .row()
    .text('🔍 חיפוש', 'menu:search')
    .text('📥 ייצוא', 'menu:export');

  if (user.role === 'admin') {
    kb.row().text('⚙️ הגדרות', 'menu:settings');
  }

  kb.row().add(openDashboardButton());

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
