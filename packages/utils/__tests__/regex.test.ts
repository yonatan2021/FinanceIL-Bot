import { describe, it, expect } from 'vitest';
import { isValidRegex } from '../regex';

describe('isValidRegex', () => {
  it('returns true for a simple string pattern', () => {
    expect(isValidRegex('hello')).toBe(true);
  });

  it('returns true for a valid regex with special characters', () => {
    expect(isValidRegex('^[A-Z]+\\d{2}$')).toBe(true);
  });

  it('returns true for an empty pattern', () => {
    expect(isValidRegex('')).toBe(true);
  });

  it('returns true for a pattern with flags-like syntax in pattern', () => {
    expect(isValidRegex('(foo|bar)')).toBe(true);
  });

  it('returns false for an unbalanced group', () => {
    expect(isValidRegex('(unclosed')).toBe(false);
  });

  it('returns false for an invalid quantifier', () => {
    expect(isValidRegex('*invalid')).toBe(false);
  });

  it('returns false for an invalid character class range', () => {
    expect(isValidRegex('[z-a]')).toBe(false);
  });
});
