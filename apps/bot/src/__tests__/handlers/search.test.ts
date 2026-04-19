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

import { csvEscape, generateCSV, buildSearchResultText } from '../../handlers/search.js';
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

describe('buildSearchResultText — truncation behavior', () => {
  const makeTxn = (id: string, overrides: Partial<Transaction> = {}): Transaction => ({
    id,
    accountId: 'acc-1',
    date: new Date('2026-04-15'),
    description: 'א'.repeat(80), // long description to inflate output size
    amount: -100,
    currency: 'ILS',
    type: 'normal',
    category: 'מזון',
    status: 'completed',
    createdAt: new Date(),
    ...overrides,
  });

  it('returns the full message when output is under 3800 chars', () => {
    const txns = [makeTxn('1', { description: 'קפה' })];
    const result = buildSearchResultText(txns, 'מזון');
    expect(result.length).toBeLessThanOrEqual(3800);
    expect(result).toContain('מזון');
    expect(result).not.toContain('תוצאות נוספות');
  });

  it('returns fallback message when transaction list is empty', () => {
    const result = buildSearchResultText([], 'מזון');
    expect(result).toContain('אין עסקאות');
    expect(result).toContain('מזון');
  });

  it('truncates to first 10 results when formatted output exceeds 3800 chars', () => {
    // 50 transactions each with a long description will produce a message > 3800 chars
    const txns = Array.from({ length: 50 }, (_, i) => makeTxn(String(i)));
    const result = buildSearchResultText(txns, 'מזון');
    expect(result.length).toBeGreaterThan(0);
    // The truncation note in Hebrew should appear
    expect(result).toContain('תוצאות נוספות');
    // Should mention the remaining count (50 - 10 = 40)
    expect(result).toContain('40');
  });

  it('truncated message is shorter than the full untruncated message', () => {
    const txns = Array.from({ length: 50 }, (_, i) => makeTxn(String(i)));
    const fullMessage = `🔍 *עסקאות*\n\n${txns.map((t) => t.description).join('\n')}`;
    const result = buildSearchResultText(txns, 'מזון');
    // Result must be within Telegram limits and not contain all 50 descriptions verbatim
    expect(result.length).toBeLessThanOrEqual(fullMessage.length);
  });
});
