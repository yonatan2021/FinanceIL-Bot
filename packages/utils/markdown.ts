/**
 * Escapes all Telegram MarkdownV2 special characters in a single pass.
 * Backslash is first in the character class so it is replaced before any
 * other substitution adds backslashes — preventing double-escaping.
 * Special chars: \ _ * [ ] ( ) ~ ` > # + - = | { } . !
 */
export function escapeMarkdownV2(text: string): string {
  return text.replace(/[\\\_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
