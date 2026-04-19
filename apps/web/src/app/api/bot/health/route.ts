export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { botHeartbeat } from "@finance-bot/db/schema";
import { eq } from "drizzle-orm";
import type { BotHeartbeat } from "@finance-bot/types";

type HeartbeatWithStatus = BotHeartbeat & { status: 'online' | 'stale' };

export async function GET(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const db = await getDb();
  const rows = await db
    .select()
    .from(botHeartbeat)
    .where(eq(botHeartbeat.id, 1));

  if (rows.length === 0) {
    return NextResponse.json({ success: true, data: null });
  }

  const row = rows[0];
  const heartbeat: BotHeartbeat = {
    id: row.id,
    lastBeatAt: row.lastBeatAt,
    pid: row.pid,
    memoryMb: row.memoryMb,
    uptimeSec: row.uptimeSec,
    lastError: row.lastError,
    lastErrorAt: row.lastErrorAt,
  };

  const isOnline =
    heartbeat.lastBeatAt !== null &&
    Date.now() - heartbeat.lastBeatAt.getTime() < 60_000;

  const data: HeartbeatWithStatus = {
    ...heartbeat,
    status: isOnline ? 'online' : 'stale',
  };

  return NextResponse.json({ success: true, data });
}
