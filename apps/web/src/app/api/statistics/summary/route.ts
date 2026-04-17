export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { transactions, budgets } from "@finance-bot/db/schema";
import { and, gte, lte, sql, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const now = new Date();
  const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
  const year = Number(searchParams.get("year") ?? now.getFullYear());

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  const dateRange = and(
    gte(transactions.date, start),
    lte(transactions.date, end)
  );

  const db = await getDb();
  const [categoryTotals, activeBudgets] = await Promise.all([
    db
      .select({
        category: transactions.category,
        total: sql<number>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(dateRange)
      .groupBy(transactions.category),
    db
      .select()
      .from(budgets)
      .where(eq(budgets.isActive, true)),
  ]);

  const expenses = categoryTotals
    .filter((r) => Number(r.total) < 0)
    .reduce((sum, r) => sum + Math.abs(Number(r.total)), 0);

  const income = categoryTotals
    .filter((r) => Number(r.total) > 0)
    .reduce((sum, r) => sum + Number(r.total), 0);

  const categoryMap = new Map<string, number>();
  for (const row of categoryTotals) {
    if (Number(row.total) < 0) {
      const key = row.category ?? "ללא קטגוריה";
      categoryMap.set(key, Math.abs(Number(row.total)));
    }
  }

  const budgetSummary = activeBudgets.map((budget) => {
    const spent = categoryMap.get(budget.categoryName) ?? 0;
    const pct = budget.monthlyLimit > 0 ? spent / budget.monthlyLimit : 0;
    return {
      categoryName: budget.categoryName,
      monthlyLimit: budget.monthlyLimit,
      spent,
      pct: Math.round(pct * 100),
      alert: pct >= (budget.alertThreshold ?? 0.8),
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      totalExpenses: expenses,
      totalIncome: income,
      budgets: budgetSummary,
      month,
      year,
    },
  });
}
