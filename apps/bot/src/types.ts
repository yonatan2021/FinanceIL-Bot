import { Context, SessionFlavor } from 'grammy';
import { type ConversationFlavor } from '@grammyjs/conversations';
import type { AllowedUser } from '@finance-bot/types';

// Empty session data — conversations plugin uses the session slot internally
export type SessionData = Record<string, never>;

export interface BotContext extends ConversationFlavor<Context>, SessionFlavor<SessionData> {
  user?: AllowedUser;
}
