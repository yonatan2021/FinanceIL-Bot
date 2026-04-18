export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { commandUsage } from "@finance-bot/db/schema";
import { gte, sql } from "drizzle-orm";

export interface ActivityEntry {
  command: string;
  count: number;
  successCount: number;
  avgDurationMs: number | null;
  lastUsed: Date;
}

export async function GET(req: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") ?? "7d";

  const days = range === "30d" ? 30 : 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const db = await getDb();

    const rows = await db
      .select({
        command: commandUsage.command,
        count: sql<number>`count(*)`.as("count"),
        successCount: sql<number>`sum(case when ${commandUsage.success} = 1 then 1 else 0 end)`.as("successCount"),
        avgDurationMs: sql<number | null>`avg(${commandUsage.durationMs})`.as("avgDurationMs"),
        lastUsed: sql<number>`max(${commandUsage.timestamp})`.as("lastUsed"),
      })
      .from(commandUsage)
      .where(gte(commandUsage.timestamp, since))
      .groupBy(commandUsage.command)
      .orderBy(sql`count(*) desc`);

    const data: ActivityEntry[] = rows.map((row) => ({
      command: row.command,
      count: row.count,
      successCount: row.successCount ?? 0,
      avgDurationMs: row.avgDurationMs,
      lastUsed: new Date(row.lastUsed * 1000),
    }));

    // Summary stats
    const totalRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(commandUsage)
      .where(gte(commandUsage.timestamp, since));

    const uniqueUsersRows = await db
      .select({ count: sql<number>`count(distinct ${commandUsage.telegramId})` })
      .from(commandUsage)
      .where(gte(commandUsage.timestamp, since));

    const successRows = await db
      .select({ count: sql<number>`sum(case when ${commandUsage.success} = 1 then 1 else 0 end)` })
      .from(commandUsage)
      .where(gte(commandUsage.timestamp, since));

    const totalCommands = totalRows[0]?.count ?? 0;
    const uniqueUsers = uniqueUsersRows[0]?.count ?? 0;
    const successCount = successRows[0]?.count ?? 0;
    const successRate = totalCommands > 0 ? Math.round((successCount / totalCommands) * 100) : null;

    return NextResponse.json({
      success: true,
      data,
      meta: {
        totalCommands,
        uniqueUsers,
        successRate,
        rangeDays: days,
      },
    });
  } catch (err) {
    console.error({ action: 'bot_activity_failed', code: (err as NodeJS.ErrnoException).code });
    return NextResponse.json({ error: 'שגיאה פנימית', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
