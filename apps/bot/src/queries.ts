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

export function getBudgetAlertCount(): number {
  const budgets = getActiveBudgets();
  const txns = getCurrentMonthTransactions();
  const spending: Record<string, number> = {};
  txns.forEach((t) => {
    if (t.category) {
      spending[t.category] = (spending[t.category] ?? 0) + t.amount;
    }
  });
  return budgets.filter((b) => {
    const spent = spending[b.categoryName] ?? 0;
    const threshold = b.alertThreshold ?? 0.8;
    return b.monthlyLimit > 0 && spent / b.monthlyLimit >= threshold;
  }).length;
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

  const baseQuery = db
    .select()
    .from(transactions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(transactions.date));

  return options.limit !== undefined
    ? baseQuery.limit(options.limit).all()
    : baseQuery.all();
}

export function getAllCategories() {
  const categories = db
    .selectDistinct({ category: transactions.category })
    .from(transactions)
    .where(sql`${transactions.category} IS NOT NULL`)
    .all();
  return categories.map((c) => c.category).filter(Boolean) as string[];
}

export function getBudgetCategories() {
  const result = db
    .select({ categoryName: budgets.categoryName })
    .from(budgets)
    .where(eq(budgets.isActive, true))
    .all();
  return result.map((r) => r.categoryName);
}
