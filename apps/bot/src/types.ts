import { Context } from 'grammy';
import type { AllowedUser } from '@finance-bot/types';

export interface BotContext extends Context {
  user?: AllowedUser;
}
