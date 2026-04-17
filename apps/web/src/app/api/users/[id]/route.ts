export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { allowedUsers } from "@finance-bot/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "גוף הבקשה אינו תקין" }, { status: 400 });
  }

  const { is_active, role } = body as { is_active?: boolean; role?: string };

  const updateData: Partial<{ isActive: boolean; role: string }> = {};
  if (typeof is_active === "boolean") updateData.isActive = is_active;
  if (role !== undefined) {
    const validRoles = ["admin", "viewer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "תפקיד לא תקין" }, { status: 400 });
    }
    updateData.role = role;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "אין שדות לעדכון" }, { status: 400 });
  }

  const db = await getDb();
  const [updated] = await db
    .update(allowedUsers)
    .set(updateData)
    .where(eq(allowedUsers.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
  }

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
    .update(allowedUsers)
    .set({ isActive: false })
    .where(eq(allowedUsers.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "משתמש לא נמצא" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: updated });
}
