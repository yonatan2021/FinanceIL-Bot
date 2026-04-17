export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { credentials } from "@finance-bot/db/schema";
import { eq } from "drizzle-orm";

function safe(row: typeof credentials.$inferSelect) {
  const { encryptedData: _s, ...rest } = row;
  return rest;
}

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

  const { displayName, status } = body as { displayName?: string; status?: string };
  const updates: Partial<typeof credentials.$inferInsert> = {};
  if (displayName !== undefined) updates.displayName = displayName;
  if (status !== undefined) {
    const validStatuses = ["active", "disabled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "סטטוס לא תקין" }, { status: 400 });
    }
    updates.status = status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "אין שדות לעדכון" }, { status: 400 });
  }

  const db = await getDb();
  const [updated] = await db
    .update(credentials)
    .set(updates)
    .where(eq(credentials.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "פרטי בנק לא נמצאו" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: safe(updated) });
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
    .update(credentials)
    .set({ status: "disabled" })
    .where(eq(credentials.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "פרטי בנק לא נמצאו" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: safe(updated) });
}
