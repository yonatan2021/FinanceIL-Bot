import { describe, it, expect } from 'vitest';
import { formatDateHE, hebrewMonthName, currentMonthRange } from '../dates.js';

describe('formatDateHE', () => {
  it('formats to DD/MM/YYYY', () => {
    expect(formatDateHE(new Date(2024, 0, 5))).toBe('05/01/2024');
  });

  it('pads single-digit day and month', () => {
    expect(formatDateHE(new Date(2024, 2, 7))).toBe('07/03/2024');
  });

  it('handles end-of-year date', () => {
    expect(formatDateHE(new Date(2023, 11, 31))).toBe('31/12/2023');
  });
});

describe('hebrewMonthName', () => {
  const expected: Record<number, string> = {
    0: 'ינואר', 1: 'פברואר', 2: 'מרץ', 3: 'אפריל',
    4: 'מאי', 5: 'יוני', 6: 'יולי', 7: 'אוגוסט',
    8: 'ספטמבר', 9: 'אוקטובר', 10: 'נובמבר', 11: 'דצמבר',
  };

  for (const [month, name] of Object.entries(expected)) {
    it(`returns ${name} for month index ${month}`, () => {
      expect(hebrewMonthName(new Date(2024, Number(month), 1))).toBe(name);
    });
  }
});

describe('currentMonthRange', () => {
  it('start is first day of current month at midnight', () => {
    const { start } = currentMonthRange();
    const now = new Date();
    expect(start.getFullYear()).toBe(now.getFullYear());
    expect(start.getMonth()).toBe(now.getMonth());
    expect(start.getDate()).toBe(1);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });

  it('end is last moment of current month', () => {
    const { end } = currentMonthRange();
    const now = new Date();
    expect(end.getFullYear()).toBe(now.getFullYear());
    expect(end.getMonth()).toBe(now.getMonth());
    const nextDay = new Date(end.getTime() + 1);
    expect(nextDay.getMonth()).not.toBe(now.getMonth());
  });

  it('start is before end', () => {
    const { start, end } = currentMonthRange();
    expect(start.getTime()).toBeLessThan(end.getTime());
  });
});
