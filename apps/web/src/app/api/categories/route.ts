export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { transactions, budgets } from "@finance-bot/db/schema";
import { sql } from "drizzle-orm";

export interface CategorySummary {
  name: string;
  transactionCount: number;
  hasBudget: boolean;
}

export async function GET(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const db = await getDb();

    // Distinct category names from transactions (non-null)
    const txCategories = await db
      .select({
        name: transactions.category,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(transactions)
      .where(sql`${transactions.category} is not null`)
      .groupBy(transactions.category);

    // Active budget category names
    const budgetRows = await db
      .select({ categoryName: budgets.categoryName })
      .from(budgets);

    const budgetCategoryNames = new Set(budgetRows.map((b) => b.categoryName));

    // Collect all unique category names from transactions
    const categoryMap = new Map<string, { transactionCount: number; hasBudget: boolean }>();

    for (const row of txCategories) {
      if (row.name) {
        categoryMap.set(row.name, {
          transactionCount: row.count,
          hasBudget: budgetCategoryNames.has(row.name),
        });
      }
    }

    // Also include budget categories with 0 transactions
    for (const name of budgetCategoryNames) {
      if (!categoryMap.has(name)) {
        categoryMap.set(name, { transactionCount: 0, hasBudget: true });
      }
    }

    const data: CategorySummary[] = Array.from(categoryMap.entries()).map(
      ([name, stats]) => ({ name, ...stats })
    );

    // Sort by transaction count descending
    data.sort((a, b) => b.transactionCount - a.transactionCount);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[categories] DB error:", (err as Error).message);
    return NextResponse.json({ error: "שגיאת מסד נתונים", code: "DB_ERROR" }, { status: 500 });
  }
}
