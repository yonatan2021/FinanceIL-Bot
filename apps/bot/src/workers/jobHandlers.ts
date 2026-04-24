import { logger } from '../lib/logger.js';
import type { Bot } from 'grammy';
import type { BotContext } from '../types.js';
import type {
  ScrapeAllPayload,
  ScrapeCredentialPayload,
  BroadcastScheduledPayload,
  JobQueueRow,
} from '@finance-bot/types';

const WEB_INTERNAL_URL = process.env.WEB_INTERNAL_URL ?? 'http://web:5200';
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET ?? '';

async function callScrapeApi(credentialId?: number): Promise<{ success: boolean; message: string }> {
  const url = `${WEB_INTERNAL_URL}/api/scrape`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': INTERNAL_API_SECRET,
    },
    body: JSON.stringify(credentialId !== undefined ? { credentialId } : {}),
  });

  if (!res.ok) {
    throw new Error(`Scrape API returned ${res.status}`);
  }

  return res.json() as Promise<{ success: boolean; message: string }>;
}

export async function handleScrapeAll(
  job: JobQueueRow,
  bot: Bot<BotContext>,
  adminChatId: number
): Promise<string> {
  const payload = JSON.parse(job.payload) as ScrapeAllPayload;
  logger.info({ action: 'scrape_all_started', triggeredBy: payload.triggeredBy });

  const result = await callScrapeApi();

  const msg = result.success
    ? '✅ סקריפציה הושלמה בהצלחה'
    : `❌ סקריפציה נכשלה: ${result.message}`;

  if (adminChatId !== 0) {
    await bot.api.sendMessage(adminChatId, msg);
  }
  return msg;
}

export async function handleScrapeCredential(
  job: JobQueueRow,
  bot: Bot<BotContext>,
  adminChatId: number
): Promise<string> {
  const payload = JSON.parse(job.payload) as ScrapeCredentialPayload;
  logger.info({
    action: 'scrape_credential_started',
    credentialId: payload.credentialId,
    triggeredBy: payload.triggeredBy,
  });

  const result = await callScrapeApi(payload.credentialId);

  const msg = result.success
    ? `✅ סקריפציה של credential ${payload.credentialId} הושלמה`
    : `❌ סקריפציה של credential ${payload.credentialId} נכשלה: ${result.message}`;

  if (adminChatId !== 0) {
    await bot.api.sendMessage(adminChatId, msg);
  }
  return msg;
}

export async function handleBroadcastScheduled(job: JobQueueRow): Promise<string> {
  const payload = JSON.parse(job.payload) as BroadcastScheduledPayload;
  logger.info({ action: 'broadcast_scheduled_handled', batchId: payload.batchId });
  // Messages were already batch-inserted into outbox_messages when this job was enqueued.
  // The outboxWorker delivers them — nothing to do here.
  return `broadcast batch ${payload.batchId} is in outbox`;
}
