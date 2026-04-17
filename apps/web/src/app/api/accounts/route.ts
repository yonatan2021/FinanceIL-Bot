export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { accounts, credentials } from "@finance-bot/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const rows = await db
    .select({
      id: accounts.id,
      credentialId: accounts.credentialId,
      accountNumber: accounts.accountNumber,
      balance: accounts.balance,
      lastUpdatedAt: accounts.lastUpdatedAt,
      bankDisplayName: credentials.displayName,
      bankId: credentials.bankId,
    })
    .from(accounts)
    .leftJoin(credentials, eq(accounts.credentialId, credentials.id));

  return NextResponse.json({ success: true, data: rows });
}
