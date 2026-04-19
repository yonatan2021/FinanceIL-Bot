export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { schedulerState } from "@finance-bot/db/schema";
import type { SchedulerJob, SchedulerJobName, SchedulerJobStatus } from "@finance-bot/types";

const DEFAULT_JOBS = [
  { jobName: 'daily-budget-alerts', cronExpression: '0 8 * * *', enabled: true },
  { jobName: 'weekly-summary', cronExpression: '0 9 * * 0', enabled: true },
  { jobName: 'monthly-report', cronExpression: '0 9 1 * *', enabled: true },
] as const;

export async function GET(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const db = await getDb();
  let rows = await db.select().from(schedulerState);

  if (rows.length === 0) {
    const now = new Date();
    const seedRows = DEFAULT_JOBS.map((job) => ({
      jobName: job.jobName,
      cronExpression: job.cronExpression,
      enabled: job.enabled,
      lastRunAt: null,
      lastStatus: null,
      lastError: null,
      nextRunAt: null,
      updatedAt: now,
    }));

    await db.insert(schedulerState).values(seedRows);
    rows = await db.select().from(schedulerState);
  }

  const data: SchedulerJob[] = rows.map((row) => ({
    jobName: row.jobName as SchedulerJobName,
    enabled: row.enabled,
    cronExpression: row.cronExpression,
    lastRunAt: row.lastRunAt,
    lastStatus: row.lastStatus as SchedulerJobStatus | null,
    lastError: row.lastError,
    nextRunAt: row.nextRunAt,
    updatedAt: row.updatedAt,
  }));

  return NextResponse.json({ success: true, data });
}
