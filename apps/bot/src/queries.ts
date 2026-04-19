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
import { queryCache, CACHE_KEYS, CACHE_TTLS } from '@finance-bot/utils/cache';
import type { Transaction, AllowedUser, Budget, ScrapeLog } from '@finance-bot/types';

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

function currentMonthCacheKey(): string {
  const now = new Date();
  return `${CACHE_KEYS.TRANSACTIONS_CURRENT}_${now.getFullYear()}_${now.getMonth()}`;
}

export function getAllAccountsWithBank(): AccountWithBank[] {
  const cached = queryCache.get<AccountWithBank[]>(CACHE_KEYS.BALANCES);
  if (cached !== undefined) return cached;
  const result = preparedGetAllAccountsWithBank.all();
  queryCache.set(CACHE_KEYS.BALANCES, result, CACHE_TTLS.BALANCES);
  return result;
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
  const key = currentMonthCacheKey();
  const cached = queryCache.get<Transaction[]>(key);
  if (cached !== undefined) return cached;
  const { start, end } = currentMonthRange();
  const result = db
    .select()
    .from(transactions)
    .where(and(gte(transactions.date, start), lte(transactions.date, end)))
    .orderBy(desc(transactions.date))
    .limit(limit)
    .all();
  queryCache.set(key, result, CACHE_TTLS.TRANSACTIONS_CURRENT);
  return result;
}

export function getActiveBudgets() {
  const cached = queryCache.get<Budget[]>(CACHE_KEYS.BUDGETS);
  if (cached !== undefined) return cached;
  const result = preparedGetActiveBudgets.all();
  queryCache.set(CACHE_KEYS.BUDGETS, result, CACHE_TTLS.BUDGETS);
  return result;
}

export function getAllUsers() {
  const cached = queryCache.get<AllowedUser[]>(CACHE_KEYS.USERS);
  if (cached !== undefined) return cached;
  const result = preparedGetAllUsers.all();
  queryCache.set(CACHE_KEYS.USERS, result, CACHE_TTLS.USERS);
  return result;
}

export function getLatestScrapeLog(): ScrapeLog | undefined {
  if (queryCache.has(CACHE_KEYS.SCRAPE_LOG)) {
    return queryCache.get<ScrapeLog | undefined>(CACHE_KEYS.SCRAPE_LOG);
  }
  const row = preparedGetLatestScrapeLog.get();
  const result: ScrapeLog | undefined = row
    ? { ...row, status: row.status as ScrapeLog['status'] }
    : undefined;
  queryCache.set(CACHE_KEYS.SCRAPE_LOG, result, CACHE_TTLS.SCRAPE_LOG);
  return result;
}

export function getAdminUsers() {
  const cached = queryCache.get<AllowedUser[]>(CACHE_KEYS.ADMIN_USERS);
  if (cached !== undefined) return cached;
  const result = preparedGetAdminUsers.all();
  queryCache.set(CACHE_KEYS.ADMIN_USERS, result, CACHE_TTLS.ADMIN_USERS);
  return result;
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
  const accounts = getAllAccountsWithBank();
  return accounts.reduce((sum, a) => sum + a.balance, 0);
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
  const result = db
    .select({ categoryName: budgets.categoryName })
    .from(budgets)
    .where(eq(budgets.isActive, true))
    .all();
  return result.map((r) => r.categoryName);
}

export function invalidateAfterScrape(): void {
  queryCache.delete(CACHE_KEYS.BALANCES);
  queryCache.delete(CACHE_KEYS.BUDGETS);
  queryCache.delete(CACHE_KEYS.SCRAPE_LOG);
  queryCache.invalidatePrefix(CACHE_KEYS.TRANSACTIONS_CURRENT);
}
