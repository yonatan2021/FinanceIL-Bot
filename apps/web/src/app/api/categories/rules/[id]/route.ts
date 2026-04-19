export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { categoryRules } from "@finance-bot/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { isValidRegex } from "@finance-bot/utils/regex";

const UpdateRuleSchema = z.object({
  categoryName: z.string().min(1).optional(),
  pattern: z.string().min(1).optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const idResult = z.coerce.number().int().positive().safeParse(idStr);
  if (!idResult.success) {
    return NextResponse.json({ error: "מזהה לא תקין", code: "INVALID_ID" }, { status: 400 });
  }
  const id = idResult.data;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON", code: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = UpdateRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "נתונים לא תקינים", code: "INVALID_PARAMS" },
      { status: 400 }
    );
  }

  const updates = parsed.data;

  if (updates.pattern !== undefined && !isValidRegex(updates.pattern)) {
    return NextResponse.json(
      { error: "תבנית regex לא תקינה", code: "INVALID_REGEX" },
      { status: 400 }
    );
  }

  try {
    const db = await getDb();
    const [updated] = await db
      .update(categoryRules)
      .set(updates)
      .where(eq(categoryRules.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "כלל לא נמצא", code: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[categories/rules PUT] DB error:", (err as Error).message);
    return NextResponse.json({ error: "שגיאת מסד נתונים", code: "DB_ERROR" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id: idStr } = await params;
  const idResult = z.coerce.number().int().positive().safeParse(idStr);
  if (!idResult.success) {
    return NextResponse.json({ error: "מזהה לא תקין", code: "INVALID_ID" }, { status: 400 });
  }
  const id = idResult.data;

  try {
    const db = await getDb();
    const [deleted] = await db
      .delete(categoryRules)
      .where(eq(categoryRules.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "כלל לא נמצא", code: "NOT_FOUND" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: null });
  } catch (err) {
    console.error("[categories/rules DELETE] DB error:", (err as Error).message);
    return NextResponse.json({ error: "שגיאת מסד נתונים", code: "DB_ERROR" }, { status: 500 });
  }
}
