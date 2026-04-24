import { sqliteTable, text, real, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

export const credentials = sqliteTable('credentials', {
  id: text('id').primaryKey(),
  bankId: text('bank_id').notNull(),
  displayName: text('display_name').notNull(),
  // encryptedData is a base64-encoded AES ciphertext
  encryptedData: text('encrypted_data').notNull(),
  status: text('status').default('active'),
  lastScrapedAt: integer('last_scraped_at', { mode: 'timestamp' }),
});

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  credentialId: text('credential_id').references(() => credentials.id).notNull(),
  accountNumber: text('account_number').notNull(),
  balance: real('balance').notNull(),
  lastUpdatedAt: integer('last_updated_at', { mode: 'timestamp' }),
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  accountId: text('account_id').references(() => accounts.id).notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').default('ILS').notNull(),
  type: text('type').notNull(),
  category: text('category'),
  status: text('status').default('completed'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => ({
  // מניעת כפילויות: אותו חשבון + תאריך + תיאור + סכום = אותה עסקה
  uniqueTransaction: uniqueIndex('unique_transaction').on(
    table.accountId,
    table.date,
    table.description,
    table.amount,
  ),
}));

// NOTE: allowedUsers table header was missing from source doc (formatting loss).
// Fields below are verbatim from doc. Table name and id column reconstructed.
export const allowedUsers = sqliteTable('allowed_users', {
  id: text('id').primaryKey(),
  telegramId: text('telegram_id').notNull().unique(),
  name: text('name'),
  role: text('role').default('viewer').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  addedBy: text('added_by'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }),
});

export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey(),
  categoryName: text('category_name').notNull(),
  monthlyLimit: real('monthly_limit').notNull(),
  period: text('period').default('monthly'),
  alertThreshold: real('alert_threshold').default(0.8),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const scrapeLogs = sqliteTable('scrape_logs', {
  id: text('id').primaryKey(),
  credentialId: text('credential_id').references(() => credentials.id),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  finishedAt: integer('finished_at', { mode: 'timestamp' }),
  transactionsFetched: integer('transactions_fetched').default(0),
  status: text('status').notNull(), // success / error / partial
  errorMessage: text('error_message'),
});

// Scheduler job state — 3 rows, one per cron job
export const schedulerState = sqliteTable('scheduler_state', {
  jobName: text('job_name').primaryKey(),
  enabled: integer('enabled', { mode: 'boolean' }).default(true).notNull(),
  cronExpression: text('cron_expression').notNull(),
  lastRunAt: integer('last_run_at', { mode: 'timestamp' }),
  lastStatus: text('last_status'), // 'success' | 'error' | null
  lastError: text('last_error'),
  nextRunAt: integer('next_run_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  silentNotifications: integer('silent_notifications', { mode: 'boolean' }).default(false).notNull(),
});

// Bot heartbeat — single row, updated every 30s by bot
export const botHeartbeat = sqliteTable('bot_heartbeat', {
  id: integer('id').primaryKey().default(1),
  lastBeatAt: integer('last_beat_at', { mode: 'timestamp' }),
  pid: integer('pid'),
  memoryMb: integer('memory_mb'),
  uptimeSec: integer('uptime_sec'),
  lastError: text('last_error'),
  lastErrorAt: integer('last_error_at', { mode: 'timestamp' }),
});

// Command usage telemetry — fed by bot middleware (future)
export const commandUsage = sqliteTable('command_usage', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  telegramId: text('telegram_id').notNull(),
  command: text('command').notNull(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  success: integer('success', { mode: 'boolean' }).default(true),
  durationMs: integer('duration_ms'),
}, (table) => ({
  idxTelegramTimestamp: index('idx_command_usage_telegram').on(table.telegramId, table.timestamp),
  idxCommandTimestamp: index('idx_command_usage_command').on(table.command, table.timestamp),
}));

// Bot configuration — single row (id=1 always)
export const botConfig = sqliteTable('bot_config', {
  id: integer('id').primaryKey().default(1),
  dashboardUrl: text('dashboard_url').notNull().default(''),
  enableDeepLinks: integer('enable_deep_links', { mode: 'boolean' }).notNull().default(true),
  enablePinning: integer('enable_pinning', { mode: 'boolean' }).notNull().default(true),
  enableConversations: integer('enable_conversations', { mode: 'boolean' }).notNull().default(true),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Category auto-sort rules
export const categoryRules = sqliteTable('category_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryName: text('category_name').notNull(),
  pattern: text('pattern').notNull(),  // regex source string
  priority: integer('priority').default(0).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// SQLite-backed job queue for background tasks
export const jobQueue = sqliteTable('job_queue', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  type: text('type', {
    enum: ['scrape_all', 'scrape_credential', 'broadcast_scheduled'],
  }).notNull(),
  payload: text('payload').notNull().default('{}'),
  status: text('status', {
    enum: ['pending', 'running', 'done', 'failed', 'dead'],
  }).notNull().default('pending'),
  runAfter: integer('run_after', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  correlationId: text('correlation_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  finishedAt: integer('finished_at', { mode: 'timestamp' }),
  lastError: text('last_error'),
  result: text('result'),
}, (table) => ({
  statusRunAfterIdx: index('job_queue_status_run_after_idx').on(table.status, table.runAfter),
  typeCreatedAtIdx: index('job_queue_type_created_at_idx').on(table.type, table.createdAt),
}));

// Outbox pattern: Telegram messages queued for reliable delivery
export const outboxMessages = sqliteTable('outbox_messages', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  telegramId: integer('telegram_id', { mode: 'number' }).notNull(),
  text: text('text').notNull(),
  parseMode: text('parse_mode'),
  disableNotification: integer('disable_notification', { mode: 'boolean' }).notNull().default(false),
  replyMarkupJson: text('reply_markup_json'),
  status: text('status', {
    enum: ['pending', 'running', 'sent', 'failed', 'dead'],
  }).notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  maxAttempts: integer('max_attempts').notNull().default(3),
  sendAfter: integer('send_after', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  batchId: text('batch_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  sentAt: integer('sent_at', { mode: 'timestamp' }),
  lastError: text('last_error'),
}, (table) => ({
  statusSendAfterIdx: index('outbox_status_send_after_idx').on(table.status, table.sendAfter),
  batchIdIdx: index('outbox_batch_id_idx').on(table.batchId),
}));

// Per-user rate limit sliding window buckets
export const rateLimitBuckets = sqliteTable('rate_limit_buckets', {
  telegramId: integer('telegram_id', { mode: 'number' }).primaryKey(),
  windowStart: integer('window_start').notNull(),
  requestCount: integer('request_count').notNull().default(1),
  updatedAt: integer('updated_at').notNull().$defaultFn(() => Date.now()),
});
