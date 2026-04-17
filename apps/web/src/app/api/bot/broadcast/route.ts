export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { allowedUsers } from "@finance-bot/db/schema";
import { eq, and } from "drizzle-orm";

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

  const token = process.env.BOT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { success: false, error: "BOT_TOKEN not configured" },
      { status: 500 }
    );
  }

  const db = await getDb();
  const users =
    broadcastTarget === "admins"
      ? await db
          .select()
          .from(allowedUsers)
          .where(and(eq(allowedUsers.role, "admin"), eq(allowedUsers.isActive, true)))
      : await db.select().from(allowedUsers).where(eq(allowedUsers.isActive, true));

  let sent = 0;
  let failed = 0;
  for (const user of users) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: user.telegramId, text: message }),
      });
      if (res.ok) sent++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ success: true, sent, failed });
}
