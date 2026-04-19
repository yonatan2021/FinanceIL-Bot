import { describe, it, expect } from 'vitest';
import { escapeMarkdownV2 } from '../markdown.js';

describe('escapeMarkdownV2', () => {
  it('escapes underscore', () => {
    expect(escapeMarkdownV2('hello_world')).toBe('hello\\_world');
  });
  it('escapes asterisk', () => {
    expect(escapeMarkdownV2('a*b')).toBe('a\\*b');
  });
  it('escapes parentheses', () => {
    expect(escapeMarkdownV2('(hello)')).toBe('\\(hello\\)');
  });
  it('escapes dot', () => {
    expect(escapeMarkdownV2('file.ts')).toBe('file\\.ts');
  });
  it('escapes minus sign', () => {
    expect(escapeMarkdownV2('-100')).toBe('\\-100');
  });
  it('escapes exclamation mark', () => {
    expect(escapeMarkdownV2('hello!')).toBe('hello\\!');
  });
  it('escapes backslash before other chars (no double-escape)', () => {
    expect(escapeMarkdownV2('a\\b')).toBe('a\\\\b');
  });
  it('does not mangle plain Hebrew text', () => {
    expect(escapeMarkdownV2('שלום')).toBe('שלום');
  });
  it('empty string returns empty string', () => {
    expect(escapeMarkdownV2('')).toBe('');
  });
  it('mixed text', () => {
    expect(escapeMarkdownV2('בנק.לאומי (חסכון)')).toBe('בנק\\.לאומי \\(חסכון\\)');
  });
});

describe('escapeMarkdownV2 — all special chars', () => {
  it('escapes backslash correctly (single pass)', () => {
    expect(escapeMarkdownV2('a\\b')).toBe('a\\\\b');
    // Should NOT produce a\\\\\\\\b (double-escaping bug)
    expect(escapeMarkdownV2('a\\b').split('\\').length - 1).toBe(2);
  });

  it('escapes all 18 MarkdownV2 special characters (excluding backslash)', () => {
    expect(escapeMarkdownV2('[a]')).toBe('\\[a\\]');
    expect(escapeMarkdownV2('`code`')).toBe('\\`code\\`');
    expect(escapeMarkdownV2('~strike~')).toBe('\\~strike\\~');
    expect(escapeMarkdownV2('>quote')).toBe('\\>quote');
    expect(escapeMarkdownV2('#head')).toBe('\\#head');
    expect(escapeMarkdownV2('+add')).toBe('\\+add');
    expect(escapeMarkdownV2('a=b')).toBe('a\\=b');
    expect(escapeMarkdownV2('a|b')).toBe('a\\|b');
    expect(escapeMarkdownV2('{x}')).toBe('\\{x\\}');
  });

  it('handles string with multiple special chars', () => {
    expect(escapeMarkdownV2('(test) [note] {val}')).toBe('\\(test\\) \\[note\\] \\{val\\}');
  });
});
