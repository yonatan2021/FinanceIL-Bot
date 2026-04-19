import { Context } from 'grammy';
import { type ConversationFlavor } from '@grammyjs/conversations';
import type { AllowedUser } from '@finance-bot/types';

export interface BotContext extends ConversationFlavor<Context> {
  user?: AllowedUser;
}
