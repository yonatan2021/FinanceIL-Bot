import { describe, test, expect } from 'vitest';
import {
  formatAmount,
  formatBalancesMessage,
  formatBudgetMessage,
  formatTransactionsMessage,
  formatUsersMessage,
  formatScrapeLogMessage,
  formatSummaryMessage,
  formatStatusMessage,
} from '../formatters.js';
import type { Budget, Transaction, AllowedUser, ScrapeLog } from '@finance-bot/types';

describe('formatAmount', () => {
  test('positive whole number', () => {
    expect(formatAmount(12345)).toBe('₪12,345');
  });
  test('negative number escapes minus for MarkdownV2', () => {
    // The returned string is \-₪500 (backslash + minus + ₪ + 500)
    expect(formatAmount(-500)).toBe('\\-₪500');
  });
  test('zero', () => {
    expect(formatAmount(0)).toBe('₪0');
  });
});

describe('formatBalancesMessage', () => {
  test('empty array returns Hebrew fallback', () => {
    expect(formatBalancesMessage([])).toBe('אין חשבונות רשומים.');
  });
  test('shows last 4 digits and formatted balance', () => {
    const rows = [{ accountNumber: '123456789', balance: 1000, displayName: 'בנק לאומי' }];
    const result = formatBalancesMessage(rows);
    expect(result).toContain('6789');
    expect(result).toContain('₪1,000');
    expect(result).toContain('בנק לאומי');
  });
  test('null displayName falls back to "בנק"', () => {
    const rows = [{ accountNumber: '1234', balance: 500, displayName: null }];
    expect(formatBalancesMessage(rows)).toContain('בנק');
  });
  test('bank name with special chars is escaped', () => {
    const rows = [{ accountNumber: '1234', balance: 100, displayName: 'בנק.לאומי (חסכון)' }];
    const result = formatBalancesMessage(rows);
    expect(result).toContain('בנק\\.לאומי \\(חסכון\\)');
  });
});

describe('formatBudgetMessage', () => {
  const budget: Budget = {
    id: '1', categoryName: 'מזון', monthlyLimit: 1000,
    period: 'monthly', alertThreshold: 0.8, isActive: true, createdAt: new Date(),
  };

  test('green indicator below threshold', () => {
    expect(formatBudgetMessage([budget], { 'מזון': 500 })).toContain('🟢');
  });
  test('yellow indicator at or above alert threshold', () => {
    expect(formatBudgetMessage([budget], { 'מזון': 850 })).toContain('🟡');
  });
  test('red indicator at or above 100%', () => {
    expect(formatBudgetMessage([budget], { 'מזון': 1100 })).toContain('🔴');
  });
  test('empty budgets returns Hebrew fallback', () => {
    expect(formatBudgetMessage([], {})).toBe('אין תקציבים פעילים.');
  });
  test('null alertThreshold defaults to 0.8', () => {
    const b = { ...budget, alertThreshold: null };
    expect(formatBudgetMessage([b], { 'מזון': 850 })).toContain('🟡');
  });
  test('category name with special chars is escaped', () => {
    const b: Budget = {
      id: '1', categoryName: 'מזון.בריאות', monthlyLimit: 1000,
      period: 'monthly', alertThreshold: 0.8, isActive: true, createdAt: new Date(),
    };
    const result = formatBudgetMessage([b], { 'מזון.בריאות': 500 });
    expect(result).toContain('מזון\\.בריאות');
  });
});

describe('formatTransactionsMessage', () => {
  test('empty returns Hebrew fallback', () => {
    expect(formatTransactionsMessage([])).toBe('אין עסקאות אחרונות.');
  });
  test('formats DD/MM · description · amount', () => {
    const tx: Transaction = {
      id: '1', accountId: 'a', date: new Date('2026-04-15T00:00:00Z'),
      description: 'קפה', amount: -15, currency: 'ILS',
      type: 'normal', category: null, status: 'completed', createdAt: new Date(),
    };
    const result = formatTransactionsMessage([tx]);
    expect(result).toContain('15/04');
    expect(result).toContain('קפה');
    expect(result).toContain('₪15');
  });
});

describe('formatUsersMessage', () => {
  test('empty returns Hebrew fallback', () => {
    expect(formatUsersMessage([])).toBe('אין משתמשים רשומים.');
  });
  test('active admin shows checkmark and role', () => {
    const user: AllowedUser = {
      id: '1', telegramId: '999', name: 'יוני', role: 'admin',
      isActive: true, addedBy: null, createdAt: new Date(), lastSeenAt: null,
    };
    const result = formatUsersMessage([user]);
    expect(result).toContain('✅');
    expect(result).toContain('מנהל');
    expect(result).toContain('יוני');
  });
  test('inactive user shows X and telegramId fallback', () => {
    const user: AllowedUser = {
      id: '2', telegramId: '888', name: null, role: 'viewer',
      isActive: false, addedBy: null, createdAt: new Date(), lastSeenAt: null,
    };
    const result = formatUsersMessage([user]);
    expect(result).toContain('❌');
    expect(result).toContain('888');
  });
});

describe('formatScrapeLogMessage', () => {
  test('undefined returns fallback', () => {
    expect(formatScrapeLogMessage(undefined)).toBe('אין לוגים זמינים.');
  });
  test('success log shows checkmark and count', () => {
    const log: ScrapeLog = {
      id: '1', credentialId: null, startedAt: new Date('2026-04-15'),
      finishedAt: new Date(), transactionsFetched: 42, status: 'success', errorMessage: null,
    };
    const result = formatScrapeLogMessage(log);
    expect(result).toContain('✅');
    expect(result).toContain('42');
  });
  test('error log shows red and error message', () => {
    const log: ScrapeLog = {
      id: '2', credentialId: null, startedAt: new Date(),
      finishedAt: null, transactionsFetched: 0, status: 'error', errorMessage: 'timeout',
    };
    const result = formatScrapeLogMessage(log);
    expect(result).toContain('🔴');
    expect(result).toContain('timeout');
  });
});

describe('formatSummaryMessage', () => {
  const makeBudget = (categoryName: string, monthlyLimit: number): Budget => ({
    id: '1',
    categoryName,
    monthlyLimit,
    period: 'monthly',
    alertThreshold: 0.8,
    isActive: true,
    createdAt: new Date(),
  });

  test('category with matching budget shows both spending and limit', () => {
    const budgets = [makeBudget('מזון', 1000)];
    const result = formatSummaryMessage({ 'מזון': 600 }, budgets);
    expect(result).toContain('מזון');
    expect(result).toContain('₪600');
    expect(result).toContain('₪1,000');
  });

  test('category with no matching budget shows spending only, no limit', () => {
    const result = formatSummaryMessage({ 'תחבורה': 300 }, []);
    expect(result).toContain('תחבורה');
    expect(result).toContain('₪300');
    // No budget limit appended — should not contain a slash separator pattern
    expect(result).not.toContain('/ ₪');
  });

  test('empty spending map returns Hebrew fallback string', () => {
    const result = formatSummaryMessage({}, []);
    expect(result).toBeTruthy();
    expect(result).toContain('אין הוצאות');
  });
});

describe('formatStatusMessage', () => {
  test('alertCount === 0 shows checkmark icon, no warning icon', () => {
    const result = formatStatusMessage(5000, 1200, 0);
    expect(result).toContain('✅');
    expect(result).not.toContain('⚠️');
  });

  test('alertCount > 0 shows warning icon and the count', () => {
    const result = formatStatusMessage(5000, 1200, 3);
    expect(result).toContain('⚠️');
    expect(result).toContain('3');
    expect(result).not.toContain('✅');
  });

  test('includes total balance and month spending in output', () => {
    const result = formatStatusMessage(10000, 2500, 0);
    expect(result).toContain('₪10,000');
    expect(result).toContain('₪2,500');
  });
});
