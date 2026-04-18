import { describe, it, expect } from 'vitest';
import { buildSpending } from '../helpers.js';
import type { Transaction } from '@finance-bot/types';

const makeTxn = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: '1', accountId: 'a', date: new Date(),
  description: 'test', amount: -50, currency: 'ILS',
  type: 'normal', category: 'מזון', status: 'completed', createdAt: new Date(),
  ...overrides,
});

describe('buildSpending', () => {
  it('uses absolute value so negative expenses produce positive spending', () => {
    const result = buildSpending([makeTxn({ amount: -100 })]);
    expect(result['מזון']).toBe(100);
  });

  it('accumulates multiple transactions in same category', () => {
    const result = buildSpending([
      makeTxn({ amount: -50 }),
      makeTxn({ amount: -30 }),
    ]);
    expect(result['מזון']).toBe(80);
  });

  it('groups by category with fallback "ללא קטגוריה" for null', () => {
    const result = buildSpending([makeTxn({ category: null })]);
    expect(result['ללא קטגוריה']).toBe(50);
  });

  it('handles positive amounts (refunds) as spending magnitude', () => {
    const result = buildSpending([makeTxn({ amount: 30 })]);
    expect(result['מזון']).toBe(30);
  });

  it('returns empty object for empty input', () => {
    expect(buildSpending([])).toEqual({});
  });
});
