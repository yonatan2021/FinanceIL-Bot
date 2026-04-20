export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { allowedUsers, outboxMessages } from "@finance-bot/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
  }

  const { message, target } = body as { message?: string; target?: string };

  if (!message?.trim()) {
    return NextResponse.json({ success: false, error: "message is required" }, { status: 400 });
  }

  const broadcastTarget = target === "admins" ? "admins" : "all";

  const db = await getDb();
  const users =
    broadcastTarget === "admins"
      ? await db
          .select()
          .from(allowedUsers)
          .where(and(eq(allowedUsers.role, "admin"), eq(allowedUsers.isActive, true)))
      : await db.select().from(allowedUsers).where(eq(allowedUsers.isActive, true));

  if (users.length === 0) {
    return NextResponse.json({ success: true, queued: 0 });
  }

  const batchId = randomUUID();
  const now = new Date();
  const rows = users.map((user) => ({
    telegramId: user.telegramId,
    text: message.trim(),
    parseMode: "MarkdownV2",
    disableNotification: false,
    status: "pending" as const,
    attempts: 0,
    maxAttempts: 5,
    sendAfter: now,
    batchId,
    createdAt: now,
  }));

  await db.insert(outboxMessages).values(rows);

  return NextResponse.json({ success: true, queued: users.length, batchId });
}
