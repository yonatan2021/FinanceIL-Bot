export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { transactions } from "@finance-bot/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : null;
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : null;
  const category = searchParams.get("category");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "50")));
  const offset = (page - 1) * limit;

  const db = await getDb();
  const conditions = [];

  if (month !== null && year !== null) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    conditions.push(gte(transactions.date, start));
    conditions.push(lte(transactions.date, end));
  }

  if (category) {
    conditions.push(eq(transactions.category, category));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(where)
      .orderBy(sql`${transactions.date} DESC`)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;

  return NextResponse.json({
    success: true,
    data: rows,
    meta: { total, page, limit },
  });
}
