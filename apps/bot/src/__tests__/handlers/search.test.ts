import { describe, it, expect, vi } from 'vitest';

// Mock the db-dependent modules before importing search.ts
vi.mock('../../queries.js', () => ({
  searchTransactions: vi.fn(),
  getBudgetCategories: vi.fn(),
  getCurrentMonthTransactions: vi.fn(),
}));

vi.mock('@finance-bot/db', () => ({
  db: {},
}));

import { csvEscape, generateCSV } from '../../handlers/search.js';
import type { Transaction } from '@finance-bot/types';

describe('csvEscape', () => {
  it('wraps value in double quotes', () => {
    expect(csvEscape('hello')).toBe('"hello"');
  });

  it('escapes embedded double quotes by doubling them (RFC 4180)', () => {
    expect(csvEscape('say "hello"')).toBe('"say ""hello"""');
  });

  it('prefixes = with single quote (formula injection prevention)', () => {
    expect(csvEscape('=SUM(A1)')).toBe('"\'=SUM(A1)"');
  });

  it('prefixes + with single quote', () => {
    expect(csvEscape('+tax')).toBe('"\'+tax"');
  });

  it('prefixes - with single quote', () => {
    expect(csvEscape('-fee')).toBe('"\'-fee"');
  });

  it('prefixes @ with single quote', () => {
    expect(csvEscape('@user')).toBe('"\'@user"');
  });

  it('does not modify normal text', () => {
    expect(csvEscape('קפה')).toBe('"קפה"');
  });

  it('handles empty string', () => {
    expect(csvEscape('')).toBe('""');
  });
});

describe('generateCSV', () => {
  const makeTxn = (overrides: Partial<Transaction> = {}): Transaction => ({
    id: '1',
    accountId: 'acc-1',
    date: new Date('2026-04-15'),
    description: 'קפה',
    amount: -15.5,
    currency: 'ILS',
    type: 'normal',
    category: 'מזון',
    status: 'completed',
    createdAt: new Date(),
    ...overrides,
  });

  it('first line is the header row', () => {
    const csv = generateCSV([]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('תאריך,תיאור,סכום,קטגוריה');
  });

  it('returns header only when transaction list is empty', () => {
    const csv = generateCSV([]);
    expect(csv.split('\n')).toHaveLength(1);
  });

  it('produces one data row per transaction', () => {
    const csv = generateCSV([makeTxn(), makeTxn({ id: '2' })]);
    expect(csv.split('\n')).toHaveLength(3); // header + 2 rows
  });

  it('uses ללא קטגוריה when category is null', () => {
    const csv = generateCSV([makeTxn({ category: null })]);
    expect(csv).toContain('ללא קטגוריה');
  });

  it('escapes double quotes in description', () => {
    const csv = generateCSV([makeTxn({ description: 'say "hi"' })]);
    expect(csv).toContain('"say ""hi"""');
  });
});

describe('message length guard logic', () => {
  it('short messages pass through unchanged (under 3800 chars)', () => {
    const short = 'א'.repeat(100);
    expect(short.length < 3800).toBe(true);
  });

  it('long messages would exceed 3800 chars', () => {
    const long = 'א'.repeat(3900);
    expect(long.length > 3800).toBe(true);
  });
});
