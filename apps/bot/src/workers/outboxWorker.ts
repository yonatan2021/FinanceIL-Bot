import type { Bot } from 'grammy';
import type { InlineKeyboardMarkup } from 'grammy/types';
import type { BotContext } from '../types.js';
import { db } from '@finance-bot/db';
import { outboxMessages } from '@finance-bot/db/schema';
import { and, eq, lte, asc, count } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { getAdminUsers } from '../queries.js';

const BATCH_SIZE = 20;
const SEND_DELAY_MS = 35;
const TICK_INTERVAL_MS = 1000;
const DEAD_ALERT_INTERVAL_MS = 60 * 60 * 1000;

export interface OutboxWorker {
  stop: () => void;
}

export function startOutboxWorker(bot: Bot<BotContext>): OutboxWorker {
  let shouldStop = false;
  let isRunning = false;
  let lastDeadAlertAt = 0;

  async function tick(): Promise<void> {
    if (shouldStop || isRunning) return;
    isRunning = true;

    try {
      await processBatch();
      checkDeadLetters(bot);
    } catch (err) {
      logger.error({ action: 'outbox_tick_error', errorMessage: (err as Error).message });
    } finally {
      isRunning = false;
    }

    if (!shouldStop) {
      setTimeout(() => void tick(), TICK_INTERVAL_MS);
    }
  }

  async function processBatch(): Promise<void> {
    const now = new Date();
    const rows = db
      .select()
      .from(outboxMessages)
      .where(and(eq(outboxMessages.status, 'pending'), lte(outboxMessages.sendAfter, now)))
      .orderBy(asc(outboxMessages.id))
      .limit(BATCH_SIZE)
      .all();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;

      try {
        const replyMarkup: InlineKeyboardMarkup | undefined = row.replyMarkupJson
          ? (JSON.parse(row.replyMarkupJson) as InlineKeyboardMarkup)
          : undefined;

        await bot.api.sendMessage(row.telegramId, row.text, {
          parse_mode: (row.parseMode ?? 'MarkdownV2') as 'MarkdownV2' | 'HTML',
          disable_notification: row.disableNotification ?? false,
          reply_markup: replyMarkup,
        });

        db.update(outboxMessages)
          .set({ status: 'sent', sentAt: new Date(), attempts: row.attempts + 1 })
          .where(eq(outboxMessages.id, row.id))
          .run();
      } catch (err) {
        const attempts = row.attempts + 1;
        const lastError = (err as Error).message;

        if (attempts >= row.maxAttempts) {
          db.update(outboxMessages)
            .set({ status: 'dead', attempts, lastError })
            .where(eq(outboxMessages.id, row.id))
            .run();
          logger.error({ action: 'outbox_message_dead', telegramId: row.telegramId, messageId: row.id });
        } else {
          const backoffMs = Math.min(30_000 * 2 ** (attempts - 1), 10 * 60_000);
          const sendAfter = new Date(Date.now() + backoffMs);
          db.update(outboxMessages)
            .set({ status: 'pending', attempts, sendAfter, lastError })
            .where(eq(outboxMessages.id, row.id))
            .run();
        }
      }

      if (i < rows.length - 1) {
        await new Promise<void>((resolve) => setTimeout(resolve, SEND_DELAY_MS));
      }
    }
  }

  function checkDeadLetters(botInstance: Bot<BotContext>): void {
    const now = Date.now();
    if (now - lastDeadAlertAt < DEAD_ALERT_INTERVAL_MS) return;

    const result = db
      .select({ deadCount: count() })
      .from(outboxMessages)
      .where(eq(outboxMessages.status, 'dead'))
      .get();

    const deadCount = result?.deadCount ?? 0;
    if (deadCount === 0) return;

    lastDeadAlertAt = now;
    const admins = getAdminUsers();
    const msg = `⚠️ ${deadCount} הודעות נכשלו בשליחה \\(dead letters\\)\\. בדוק את הלוג\\.`;

    for (const admin of admins) {
      botInstance.api.sendMessage(admin.telegramId, msg).catch((err: unknown) => {
        logger.error({ action: 'dead_alert_failed', telegramId: admin.telegramId, errorMessage: (err as Error).message });
      });
    }
  }

  setTimeout(() => void tick(), TICK_INTERVAL_MS);

  return {
    stop: () => { shouldStop = true; },
  };
}
