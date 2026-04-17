export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { allowedUsers } from "@finance-bot/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const { message } = body as { message?: string };

  if (!message?.trim()) {
    return NextResponse.json({ ok: false, error: "message is required" }, { status: 400 });
  }

  const token = process.env.BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "BOT_TOKEN not configured" }, { status: 500 });
  }

  const db = await getDb();
  const user = await db
    .select()
    .from(allowedUsers)
    .where(eq(allowedUsers.id, userId))
    .then((rows) => rows[0] ?? null);

  if (!user) {
    return NextResponse.json({ ok: false, error: "user not found" }, { status: 404 });
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: user.telegramId, text: message }),
    });
    const data = (await res.json()) as { ok: boolean; description?: string };
    return NextResponse.json({ ok: data.ok, error: data.description ?? null });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
