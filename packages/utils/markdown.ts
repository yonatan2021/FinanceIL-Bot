/**
 * Escapes all Telegram MarkdownV2 special characters.
 * Backslash is escaped first to prevent double-escaping.
 * Special chars: \ _ * [ ] ( ) ~ ` > # + - = | { } . !
 */
export function escapeMarkdownV2(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}
