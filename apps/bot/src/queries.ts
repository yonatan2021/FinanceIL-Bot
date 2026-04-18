import { eq, and, desc, gte, lte, sql, like } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
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
import type { Budget, Transaction } from '@finance-bot/types';

export interface AccountWithBank {
  accountNumber: string;
  balance: number;
  displayName: string | null;
}

// Prepared statements — compiled once on module load, reused on every call
const preparedGetActiveBudgets = db
  .select()
  .from(budgets)
  .where(eq(budgets.isActive, true))
  .prepare();

const preparedGetAllUsers = db
  .select()
  .from(allowedUsers)
  .prepare();

const preparedGetAdminUsers = db
  .select()
  .from(allowedUsers)
  .where(and(eq(allowedUsers.role, 'admin'), eq(allowedUsers.isActive, true)))
  .prepare();

const preparedGetAllAccountsWithBank = db
  .select({
    accountNumber: accounts.accountNumber,
    balance: accounts.balance,
    displayName: credentials.displayName,
  })
  .from(accounts)
  .leftJoin(credentials, eq(accounts.credentialId, credentials.id))
  .prepare();

const preparedGetLatestScrapeLog = db
  .select()
  .from(scrapeLogs)
  .orderBy(desc(scrapeLogs.startedAt))
  .limit(1)
  .prepare();

const preparedGetTransactionCount = db
  .select({ count: sql<number>`count(*)` })
  .from(transactions)
  .prepare();

export function getAllAccountsWithBank(): AccountWithBank[] {
  return preparedGetAllAccountsWithBank.all();
}

export function getRecentTransactions(limit = 10) {
  return db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.date))
    .limit(limit)
    .all();
}

export function getCurrentMonthTransactions(limit = 2_000) {
  const { start, end } = currentMonthRange();
  return db
    .select()
    .from(transactions)
    .where(and(gte(transactions.date, start), lte(transactions.date, end)))
    .orderBy(desc(transactions.date))
    .limit(limit)
    .all();
}

export function getActiveBudgets() {
  return preparedGetActiveBudgets.all();
}

export function getAllUsers() {
  return preparedGetAllUsers.all();
}

export function getLatestScrapeLog() {
  return preparedGetLatestScrapeLog.get();
}

export function getAdminUsers() {
  return preparedGetAdminUsers.all();
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
  const result = preparedGetTransactionCount.get();
  return result?.count ?? 0;
}

function aggregateSpending(txns: { category: string | null; amount: number }[]): Record<string, number> {
  const spending: Record<string, number> = {};
  for (const t of txns) {
    if (t.category) {
      spending[t.category] = (spending[t.category] ?? 0) + t.amount;
    }
  }
  return spending;
}

export function computeBudgetAlertCount(
  activeBudgets: { categoryName: string; monthlyLimit: number; alertThreshold: number | null }[],
  spending: Record<string, number>,
): number {
  return activeBudgets.filter((b) => {
    const spent = spending[b.categoryName] ?? 0;
    const threshold = b.alertThreshold ?? 0.8;
    return b.monthlyLimit > 0 && spent / b.monthlyLimit >= threshold;
  }).length;
}

export function getBudgetAlertCount(): number {
  const activeBudgets = getActiveBudgets();
  const txns = getCurrentMonthTransactions();
  const spending = aggregateSpending(txns);
  return computeBudgetAlertCount(activeBudgets, spending);
}

export function getTotalBalance(): number {
  return cached('totalBalance', 30_000, () => {
    const result = db
      .select({ total: sql<number>`coalesce(sum(${accounts.balance}), 0)` })
      .from(accounts)
      .get();
    return result?.total ?? 0;
  });
}

export function searchTransactions(options: {
  keyword?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  const conditions: SQL[] = [];

  if (options.keyword) {
    const escapedKeyword = options.keyword.replace(/[%_\\]/g, '\\$&');
    conditions.push(like(transactions.description, `%${escapedKeyword}%`));
  }
  if (options.category) {
    conditions.push(eq(transactions.category, options.category));
  }
  if (options.minAmount !== undefined) {
    conditions.push(gte(transactions.amount, options.minAmount));
  }
  if (options.maxAmount !== undefined) {
    conditions.push(lte(transactions.amount, options.maxAmount));
  }
  if (options.startDate) {
    conditions.push(gte(transactions.date, options.startDate));
  }
  if (options.endDate) {
    conditions.push(lte(transactions.date, options.endDate));
  }

  const effectiveLimit = Math.max(1, Math.min(options.limit ?? 500, 500));

  return db
    .select()
    .from(transactions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactions.date))
    .limit(effectiveLimit)
    .all();
}

export function getAllCategories() {
  const rows = db
    .selectDistinct({ category: transactions.category })
    .from(transactions)
    .where(sql`${transactions.category} IS NOT NULL`)
    .all();
  return rows.map((c) => c.category).filter(Boolean) as string[];
}

export function getBudgetCategories() {
  return cached('budgetCategories', 300_000, () => {
    const result = db
      .select({ categoryName: budgets.categoryName })
      .from(budgets)
      .where(eq(budgets.isActive, true))
      .all();
    return result.map((r) => r.categoryName);
  });
}
