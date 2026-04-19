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
  success: integer('success', { mode: 'boolean' }).default(true).notNull(),
  durationMs: integer('duration_ms'),
}, (table) => ({
  idxTelegramTimestamp: index('idx_command_usage_telegram').on(table.telegramId, table.timestamp),
  idxCommandTimestamp: index('idx_command_usage_command').on(table.command, table.timestamp),
}));

// Category auto-sort rules
export const categoryRules = sqliteTable('category_rules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryName: text('category_name').notNull(),
  pattern: text('pattern').notNull(),  // regex source string
  priority: integer('priority').default(0).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
