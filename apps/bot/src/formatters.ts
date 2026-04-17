import { formatDateHE } from '@finance-bot/utils/dates';
import type { Budget, Transaction, AllowedUser, ScrapeLog } from '@finance-bot/types';
import type { AccountWithBank } from './queries.js';

function escapeMarkdownV2(text: string): string {
  // MarkdownV2 special chars: _ * [ ] ( ) ~ ` > # + - = | { } . !
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

export function formatAmount(amount: number): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US'); // comma thousands separator
  return amount < 0 ? `-₪${formatted}` : `₪${formatted}`;
}

export function formatBalancesMessage(rows: AccountWithBank[]): string {
  if (rows.length === 0) return 'אין חשבונות רשומים.';
  return rows
    .map((r) => {
      const last4 = r.accountNumber.slice(-4);
      const name = r.displayName ?? 'בנק';
      return `${name} · חשבון ${last4}: ${formatAmount(r.balance)}`;
    })
    .join('\n');
}

export function formatTransactionsMessage(txns: Transaction[]): string {
  if (txns.length === 0) return 'אין עסקאות אחרונות.';
  return txns
    .map((t) => {
      const date = formatDateHE(new Date(t.date)).slice(0, 5); // DD/MM
      return `${date} · ${escapeMarkdownV2(t.description)} · ${formatAmount(t.amount)}`;
    })
    .join('\n');
}

export function formatSummaryMessage(
  spending: Record<string, number>,
  budgets: Budget[],
): string {
  const budgetMap = new Map(budgets.map((b) => [b.categoryName, b]));
  const lines: string[] = [];

  for (const [cat, spent] of Object.entries(spending)) {
    const budget = budgetMap.get(cat);
    if (budget) {
      lines.push(`${cat}: ${formatAmount(spent)} / ${formatAmount(budget.monthlyLimit)}`);
    } else {
      lines.push(`${cat}: ${formatAmount(spent)}`);
    }
  }

  return lines.length > 0 ? lines.join('\n') : 'אין הוצאות החודש.';
}

export function formatBudgetMessage(
  budgets: Budget[],
  spending: Record<string, number>,
): string {
  if (budgets.length === 0) return 'אין תקציבים פעילים.';
  return budgets
    .map((b) => {
      const spent = spending[b.categoryName] ?? 0;
      const limit = b.monthlyLimit;
      const threshold = b.alertThreshold ?? 0.8;
      const pct = limit > 0 ? spent / limit : 0;
      const pctStr = Math.round(pct * 100);
      const indicator = pct >= 1 ? '🔴' : pct >= threshold ? '🟡' : '🟢';
      return `${indicator} ${b.categoryName}: ${pctStr}% \\(${formatAmount(spent)} / ${formatAmount(limit)}\\)`;
    })
    .join('\n');
}

export function formatUsersMessage(users: AllowedUser[]): string {
  if (users.length === 0) return 'אין משתמשים רשומים.';
  return users
    .map((u) => {
      const status = u.isActive ? '✅' : '❌';
      const role = u.role === 'admin' ? 'מנהל' : 'צופה';
      const name = u.name ?? u.telegramId;
      return `${status} ${name} \\(${role}\\)`;
    })
    .join('\n');
}

export function formatScrapeLogMessage(log: ScrapeLog | undefined): string {
  if (!log) return 'אין לוגים זמינים.';
  const date = formatDateHE(new Date(log.startedAt));
  const statusIcon = log.status === 'success' ? '✅' : log.status === 'error' ? '🔴' : '⚠️';
  const count = log.transactionsFetched ?? 0;
  const err = log.errorMessage ? `\nשגיאה: ${escapeMarkdownV2(log.errorMessage)}` : '';
  return `${statusIcon} ${date}\nעסקאות: ${count}${err}`;
}
