export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { botConfig } from "@finance-bot/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { BotConfig } from "@finance-bot/types";

const DEFAULT_CONFIG = {
  id: 1 as const,
  dashboardUrl: '',
  enableDeepLinks: true,
  enablePinning: true,
  enableConversations: true,
  updatedAt: new Date(),
};

const patchSchema = z.object({
  dashboardUrl: z.string().url().or(z.literal('')).optional(),
  enableDeepLinks: z.boolean().optional(),
  enablePinning: z.boolean().optional(),
  enableConversations: z.boolean().optional(),
});

async function getOrCreateConfig(db: Awaited<ReturnType<typeof getDb>>) {
  const row = await db.select().from(botConfig).get();
  if (!row) {
    await db.insert(botConfig).values(DEFAULT_CONFIG).run();
    return await db.select().from(botConfig).get();
  }
  return row;
}

export async function GET(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const db = await getDb();
  const row = await getOrCreateConfig(db);

  const data: BotConfig = {
    id: row!.id,
    dashboardUrl: row!.dashboardUrl,
    enableDeepLinks: row!.enableDeepLinks,
    enablePinning: row!.enablePinning,
    enableConversations: row!.enableConversations,
    updatedAt: row!.updatedAt,
  };

  return NextResponse.json({ success: true, data });
}

export async function PATCH(req: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body: unknown = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'פרמטרים לא תקינים', code: 'INVALID_PARAMS' },
      { status: 400 }
    );
  }

  const db = await getDb();
  // Ensure row exists before updating
  await getOrCreateConfig(db);

  await db
    .update(botConfig)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(botConfig.id, 1))
    .run();

  const row = await db.select().from(botConfig).get();

  const data: BotConfig = {
    id: row!.id,
    dashboardUrl: row!.dashboardUrl,
    enableDeepLinks: row!.enableDeepLinks,
    enablePinning: row!.enablePinning,
    enableConversations: row!.enableConversations,
    updatedAt: row!.updatedAt,
  };

  return NextResponse.json({ success: true, data });
}
