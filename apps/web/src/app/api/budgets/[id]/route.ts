export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { budgets } from "@finance-bot/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "גוף הבקשה אינו תקין" }, { status: 400 }); }

  const { categoryName, monthlyLimit, alertThreshold } = body as {
    categoryName?: string;
    monthlyLimit?: number;
    alertThreshold?: number;
  };

  const updates: Partial<typeof budgets.$inferInsert> = {};
  if (categoryName !== undefined) updates.categoryName = categoryName;
  if (monthlyLimit !== undefined) updates.monthlyLimit = monthlyLimit;
  if (alertThreshold !== undefined) updates.alertThreshold = alertThreshold;

  const db = await getDb();
  const [updated] = await db
    .update(budgets)
    .set(updates)
    .where(eq(budgets.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "תקציב לא נמצא" }, { status: 404 });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const db = await getDb();
  const [updated] = await db
    .update(budgets)
    .set({ isActive: false })
    .where(eq(budgets.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "תקציב לא נמצא" }, { status: 404 });

  return NextResponse.json({ success: true, data: updated });
}
