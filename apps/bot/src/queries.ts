import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { db } from '@finance-bot/db';
import {
  allowedUsers,
  accounts,
  transactions,
  budgets,
  scrapeLogs,
  credentials,
} from '@finance-bot/db/schema';
import { currentMonthRange } from '@finance-bot/utils/dates';

export interface AccountWithBank {
  accountNumber: string;
  balance: number;
  displayName: string | null;
}

export function getAllAccountsWithBank(): AccountWithBank[] {
  return db
    .select({
      accountNumber: accounts.accountNumber,
      balance: accounts.balance,
      displayName: credentials.displayName,
    })
    .from(accounts)
    .leftJoin(credentials, eq(accounts.credentialId, credentials.id))
    .all();
}

export function getRecentTransactions(limit = 10) {
  return db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.date))
    .limit(limit)
    .all();
}

export function getCurrentMonthTransactions() {
  const { start, end } = currentMonthRange();
  return db
    .select()
    .from(transactions)
    .where(and(gte(transactions.date, start), lte(transactions.date, end)))
    .all();
}

export function getActiveBudgets() {
  return db
    .select()
    .from(budgets)
    .where(eq(budgets.isActive, true))
    .all();
}

export function getAllUsers() {
  return db.select().from(allowedUsers).all();
}

export function getLatestScrapeLog() {
  return db
    .select()
    .from(scrapeLogs)
    .orderBy(desc(scrapeLogs.startedAt))
    .limit(1)
    .get();
}

export function getAdminUsers() {
  return db
    .select()
    .from(allowedUsers)
    .where(and(eq(allowedUsers.role, 'admin'), eq(allowedUsers.isActive, true)))
    .all();
}

export function getTransactionPage(page: number, pageSize = 10) {
  const offset = (page - 1) * pageSize;
  return db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.date))
    .limit(pageSize)
    .offset(offset)
    .all();
}

export function getTransactionCount(): number {
  const result = db.select({ count: sql<number>`count(*)` }).from(transactions).get();
  return result?.count ?? 0;
}
