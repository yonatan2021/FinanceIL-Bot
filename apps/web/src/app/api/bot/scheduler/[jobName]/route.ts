export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { schedulerState } from "@finance-bot/db/schema";
import { eq } from "drizzle-orm";
import type { SchedulerJob, SchedulerJobName, SchedulerJobStatus } from "@finance-bot/types";

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
  await db
    .update(schedulerState)
    .set({ enabled, updatedAt: now })
    .where(eq(schedulerState.jobName, jobName));

  const rows = await db
    .select()
    .from(schedulerState)
    .where(eq(schedulerState.jobName, jobName));

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Job not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const row = rows[0];
  const data: SchedulerJob = {
    jobName: row.jobName as SchedulerJobName,
    enabled: row.enabled,
    cronExpression: row.cronExpression,
    lastRunAt: row.lastRunAt,
    lastStatus: row.lastStatus as SchedulerJobStatus | null,
    lastError: row.lastError,
    nextRunAt: row.nextRunAt,
    updatedAt: row.updatedAt,
  };

  return NextResponse.json({ success: true, data });
}
