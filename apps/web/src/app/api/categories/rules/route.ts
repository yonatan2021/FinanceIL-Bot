export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { categoryRules } from "@finance-bot/db/schema";
import { asc } from "drizzle-orm";
import { z } from "zod";

const CreateRuleSchema = z.object({
  categoryName: z.string().min(1, "שם קטגוריה נדרש"),
  pattern: z.string().min(1, "תבנית נדרשת"),
  priority: z.number().int().optional().default(0),
});

function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

export async function GET(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const db = await getDb();
  const rows = await db
    .select()
    .from(categoryRules)
    .orderBy(asc(categoryRules.priority));

  return NextResponse.json({ success: true, data: rows });
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON", code: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = CreateRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים", code: "INVALID_PARAMS" },
      { status: 400 }
    );
  }

  const { categoryName, pattern, priority } = parsed.data;

  if (!isValidRegex(pattern)) {
    return NextResponse.json(
      { error: "תבנית regex לא תקינה", code: "INVALID_REGEX" },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const [inserted] = await db
      .insert(categoryRules)
      .values({
        categoryName,
        pattern,
        priority,
        isActive: true,
        createdAt: new Date(),
      })
      .returning();

    if (!inserted) {
      return NextResponse.json({ error: 'שמירת הכלל נכשלה', code: 'INSERT_FAILED' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: inserted }, { status: 201 });
  } catch (err) {
    console.error({ action: 'category_rule_create_failed', code: (err as NodeJS.ErrnoException).code });
    return NextResponse.json({ error: 'שגיאה פנימית', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
