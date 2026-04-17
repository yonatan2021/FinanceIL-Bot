import { sqliteTable, text, real, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
