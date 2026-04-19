export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { botConfig } from "@finance-bot/db/schema";

export async function GET(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const db = await getDb();
  const row = await db.select().from(botConfig).get();
  const dashboardUrl = row?.dashboardUrl ?? '';

  if (!dashboardUrl) {
    return NextResponse.json({ success: false, error: 'לא הוגדרה כתובת דשבורד' });
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${dashboardUrl}/api/health`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'לא ניתן להגיע לדשבורד' });
    }

    const latencyMs = Date.now() - start;
    return NextResponse.json({ success: true, latencyMs });
  } catch {
    return NextResponse.json({ success: false, error: 'לא ניתן להגיע לדשבורד' });
  }
}
