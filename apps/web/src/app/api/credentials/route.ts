export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { credentials } from "@finance-bot/db/schema";
import { ne } from "drizzle-orm";
import { encrypt } from "@finance-bot/utils/crypto";
import { randomUUID } from "node:crypto";

function safeCredential(row: typeof credentials.$inferSelect) {
  const { encryptedData: _stripped, ...safe } = row;
  return safe;
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const rows = await db
    .select()
    .from(credentials)
    .where(ne(credentials.status, "disabled"));

  return NextResponse.json({
    success: true,
    data: rows.map(safeCredential),
  });
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

  const { bankId, displayName, loginData } = body as {
    bankId: string;
    displayName: string;
    loginData: Record<string, string>;
  };

  if (!bankId || !displayName || !loginData) {
    return NextResponse.json(
      { error: "bankId, displayName ו-loginData נדרשים" },
      { status: 400 }
    );
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    return NextResponse.json(
      { error: "שגיאת תצורה פנימית" },
      { status: 500 }
    );
  }

  const encryptedData = encrypt(JSON.stringify(loginData), encryptionKey);

  const db = await getDb();
  const [inserted] = await db
    .insert(credentials)
    .values({
      id: randomUUID(),
      bankId,
      displayName,
      encryptedData,
      status: "active",
    })
    .returning();

  return NextResponse.json(
    { success: true, data: safeCredential(inserted) },
    { status: 201 }
  );
}
