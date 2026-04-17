export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { scrapeLogs, credentials } from "@finance-bot/db/schema";
import { sql, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const limit = Math.min(
    100,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? "30"))
  );

  const rows = await db
    .select({
      id: scrapeLogs.id,
      credentialId: scrapeLogs.credentialId,
      startedAt: scrapeLogs.startedAt,
      finishedAt: scrapeLogs.finishedAt,
      transactionsFetched: scrapeLogs.transactionsFetched,
      status: scrapeLogs.status,
      errorMessage: scrapeLogs.errorMessage,
      bankDisplayName: credentials.displayName,
    })
    .from(scrapeLogs)
    .leftJoin(credentials, eq(scrapeLogs.credentialId, credentials.id))
    .orderBy(sql`${scrapeLogs.startedAt} DESC`)
    .limit(limit);

  return NextResponse.json({ success: true, data: rows });
}
