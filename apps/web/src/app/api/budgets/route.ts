export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { budgets } from "@finance-bot/db/schema";
import { randomUUID } from "node:crypto";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "גוף הבקשה אינו תקין" }, { status: 400 }); }

  const { categoryName, monthlyLimit, alertThreshold } = body as {
    categoryName: string;
    monthlyLimit: number;
    alertThreshold?: number;
  };

  if (!categoryName || monthlyLimit === undefined) {
    return NextResponse.json({ error: "categoryName ו-monthlyLimit נדרשים" }, { status: 400 });
  }

  const db = await getDb();
  const [inserted] = await db
    .insert(budgets)
    .values({
      id: randomUUID(),
      categoryName,
      monthlyLimit,
      alertThreshold: alertThreshold ?? 0.8,
      isActive: true,
      createdAt: new Date(),
    })
    .returning();

  return NextResponse.json({ success: true, data: inserted }, { status: 201 });
}
