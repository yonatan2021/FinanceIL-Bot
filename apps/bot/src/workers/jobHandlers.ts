import type { Bot } from 'grammy';
import type { BotContext } from '../types.js';
import type { JobPayloadMap, JobType } from '@finance-bot/types';
import { getAdminUsers, invalidateAfterScrape } from '../queries.js';
import { logger } from '../lib/logger.js';

export type JobHandler = (payload: Record<string, unknown>, bot: Bot<BotContext>) => Promise<void>;

async function notifyAdmins(bot: Bot<BotContext>, text: string): Promise<void> {
  const admins = getAdminUsers();
  for (const admin of admins) {
    await bot.api.sendMessage(admin.telegramId, text).catch((err: unknown) => {
      logger.error({ action: 'notify_admin_failed', telegramId: admin.telegramId, errorMessage: (err as Error).message });
    });
  }
}

async function handleScrapeAll(
  _payload: JobPayloadMap['scrape_all'],
  bot: Bot<BotContext>,
): Promise<void> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    throw new Error('INTERNAL_API_SECRET not configured');
  }

  const webUrl = process.env.WEB_INTERNAL_URL ?? 'http://web:5200';
  const res = await fetch(`${webUrl}/api/scrape`, {
    method: 'POST',
    headers: { 'x-internal-secret': secret },
  });

  if (!res.ok) {
    logger.error({ action: 'scraper_api_failed', status: res.status });
    await notifyAdmins(bot, `❌ הסקרייפר נכשל עם סטטוס ${res.status}\\.`);
    throw new Error(`Scraper returned status ${res.status}`);
  }

  invalidateAfterScrape();
  await notifyAdmins(bot, '✅ הסקרייפר הושלם בהצלחה\\.'); }

async function handleScrapeCredential(
  payload: JobPayloadMap['scrape_credential'],
  bot: Bot<BotContext>,
): Promise<void> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    throw new Error('INTERNAL_API_SECRET not configured');
  }

  const webUrl = process.env.WEB_INTERNAL_URL ?? 'http://web:5200';
  const res = await fetch(`${webUrl}/api/scrape`, {
    method: 'POST',
    headers: {
      'x-internal-secret': secret,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ credentialId: payload.credentialId }),
  });

  if (!res.ok) {
    logger.error({ action: 'scraper_credential_api_failed', status: res.status, credentialId: payload.credentialId });
    await notifyAdmins(bot, `❌ סקרייפר לחשבון ספציפי נכשל \\(סטטוס ${res.status}\\)\\.`);
    throw new Error(`Scraper returned status ${res.status}`);
  }

  invalidateAfterScrape();
  await notifyAdmins(bot, '✅ סקרייפר לחשבון ספציפי הושלם בהצלחה\\.');
}

export const JOB_HANDLERS: Record<JobType, JobHandler> = {
  scrape_all: (payload, bot) => handleScrapeAll(payload as unknown as JobPayloadMap['scrape_all'], bot),
  scrape_credential: (payload, bot) => handleScrapeCredential(payload as unknown as JobPayloadMap['scrape_credential'], bot),
  broadcast_scheduled: async (_payload, _bot) => {
    // Placeholder: broadcaster writes directly to outbox_messages via enqueueMessages()
    // This job type is reserved for future use.
    logger.error({ action: 'broadcast_scheduled_job_not_implemented' });
  },
};
