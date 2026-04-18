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

// ---------------------------------------------------------------------------
// TTL cache
// ---------------------------------------------------------------------------

interface CacheEntry<T> { data: T; expiresAt: number; }
const _cache = new Map<string, CacheEntry<unknown>>();

function cached<T>(key: string, ttlMs: number, fn: () => T): T {
  const entry = _cache.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() < entry.expiresAt) return entry.data;
  const data = fn();
  _cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}

/**
 * Clear one cache entry by key, or flush all entries.
 * Available keys: 'currentMonthTxns' | 'activeBudgets' | 'allAccountsWithBank' |
 *   'totalBalance' | 'allUsers' | 'budgetCategories'
 *
 * Intended to be called after a successful scrape run. Not yet wired to the
 * scraper pipeline — for now, data expires by TTL only.
 */
export function invalidateCache(key?: string): void {
  if (key !== undefined) {
    _cache.delete(key);
  } else {
    _cache.clear();
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

// TTLs align to typical scrape frequency (~5 min). Financial data (30–120 s) expires
// sooner because a scrape may update it at any time. User/category data (300 s) changes
// rarely. Cache is per-process — web and bot do not share it.
export function getAllAccountsWithBank(): AccountWithBank[] {
  return cached('allAccountsWithBank', 30_000, () =>
    db
      .select({
        accountNumber: accounts.accountNumber,
        balance: accounts.balance,
        displayName: credentials.displayName,
      })
      .from(accounts)
      .leftJoin(credentials, eq(accounts.credentialId, credentials.id))
      .all()
  );
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
  return cached('activeBudgets', 120_000, () =>
    db
      .select()
      .from(budgets)
      .where(eq(budgets.isActive, true))
      .all()
  );
}

export function getAllUsers() {
  return cached('allUsers', 300_000, () =>
    db.select().from(allowedUsers).all()
  );
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

/**
 * @param activeBudgets - Pre-fetched budgets. If provided, bypasses the cache
 *   entirely — ensure data is fresh before passing. Omit to use cached results.
 * @param monthTxns - Pre-fetched transactions. Same cache-bypass caveat as activeBudgets.
 */
export function getBudgetAlertCount(
  activeBudgets?: Budget[],
  monthTxns?: Transaction[],
): number {
  const budgetList = activeBudgets ?? getActiveBudgets();
  const txns = monthTxns ?? getCurrentMonthTransactions();
  const spending: Record<string, number> = {};
  txns.forEach((t) => {
    if (t.category) {
      spending[t.category] = (spending[t.category] ?? 0) + t.amount;
    }
  });
  return budgetList.filter((b) => {
    const spent = spending[b.categoryName] ?? 0;
    const threshold = b.alertThreshold ?? 0.8;
    return b.monthlyLimit > 0 && spent / b.monthlyLimit >= threshold;
  }).length;
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
    conditions.push(like(transactions.description, `%${options.keyword}%`));
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

  const effectiveLimit = Math.min(options.limit ?? 500, 500);

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
