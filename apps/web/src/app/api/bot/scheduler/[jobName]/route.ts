export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { schedulerState } from "@finance-bot/db/schema";
import { eq } from "drizzle-orm";
import type { SchedulerJob } from "@finance-bot/types";

const KNOWN_JOBS = ['daily-budget-alerts', 'weekly-summary', 'monthly-report'] as const;
type KnownJob = typeof KNOWN_JOBS[number];

function isKnownJob(value: string): value is KnownJob {
  return (KNOWN_JOBS as readonly string[]).includes(value);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ jobName: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { jobName } = await params;

  if (!isKnownJob(jobName)) {
    return NextResponse.json(
      { error: 'Unknown job name', code: 'INVALID_PARAMS' },
      { status: 400 },
    );
  }

  const body: unknown = await req.json().catch(() => null);
  if (
    body === null ||
    typeof body !== 'object' ||
    !('enabled' in body) ||
    typeof (body as Record<string, unknown>).enabled !== 'boolean'
  ) {
    return NextResponse.json(
      { error: 'Body must be { enabled: boolean }', code: 'INVALID_PARAMS' },
      { status: 400 },
    );
  }

  const { enabled } = body as { enabled: boolean };
  const now = new Date();

  const db = await getDb();

  try {
    const existing = await db
      .select()
      .from(schedulerState)
      .where(eq(schedulerState.jobName, jobName))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Job not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    await db
      .update(schedulerState)
      .set({ enabled, updatedAt: now })
      .where(eq(schedulerState.jobName, jobName));

    const row = existing[0];
    const data: SchedulerJob = {
      jobName: row.jobName,
      enabled,
      cronExpression: row.cronExpression,
      lastRunAt: row.lastRunAt,
      lastStatus: row.lastStatus,
      lastError: row.lastError,
      nextRunAt: row.nextRunAt,
      updatedAt: now,
    };

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[scheduler-job] DB error:', (err as Error).message);
    return NextResponse.json({ error: 'שגיאת מסד נתונים', code: 'DB_ERROR' }, { status: 500 });
  }
}
