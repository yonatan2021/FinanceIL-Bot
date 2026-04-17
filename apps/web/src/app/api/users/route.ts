export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { allowedUsers } from "@finance-bot/db/schema";
import { randomUUID } from "node:crypto";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const rows = await db
    .select()
    .from(allowedUsers)
    .orderBy(allowedUsers.createdAt);

  return NextResponse.json({ success: true, data: rows });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "גוף הבקשה אינו תקין" }, { status: 400 });
  }

  const { telegram_chat_id, name, role } = body as {
    telegram_chat_id: string;
    name?: string;
    role?: string;
  };

  if (!telegram_chat_id) {
    return NextResponse.json({ error: "telegram_chat_id נדרש" }, { status: 400 });
  }

  const validRoles = ["admin", "viewer"];
  const userRole = validRoles.includes(role ?? "") ? role! : "viewer";

  const db = await getDb();
  const [inserted] = await db
    .insert(allowedUsers)
    .values({
      id: randomUUID(),
      telegramId: String(telegram_chat_id),
      name: name ?? null,
      role: userRole,
      isActive: true,
      createdAt: new Date(),
    })
    .returning();

  return NextResponse.json({ success: true, data: inserted }, { status: 201 });
}
