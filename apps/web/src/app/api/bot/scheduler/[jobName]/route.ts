export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { schedulerState } from "@finance-bot/db/schema";
import { eq } from "drizzle-orm";
import type { SchedulerJob, ScrapeStatus } from "@finance-bot/types";

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

  const isObject = body !== null && typeof body === 'object';
  const bodyRecord = isObject ? (body as Record<string, unknown>) : {};
  const hasEnabled = 'enabled' in bodyRecord;
  const hasSilentNotifications = 'silentNotifications' in bodyRecord;

  if (
    !isObject ||
    (!hasEnabled && !hasSilentNotifications) ||
    (hasEnabled && typeof bodyRecord.enabled !== 'boolean') ||
    (hasSilentNotifications && typeof bodyRecord.silentNotifications !== 'boolean')
  ) {
    return NextResponse.json(
      {
        error: 'Body must include at least one of { enabled: boolean, silentNotifications: boolean }',
        code: 'INVALID_PARAMS',
      },
      { status: 400 },
    );
  }

  const now = new Date();

  type SchedulerUpdate = {
    updatedAt: Date;
    enabled?: boolean;
    silentNotifications?: boolean;
  };
  const updateFields: SchedulerUpdate = { updatedAt: now };
  if (hasEnabled) updateFields.enabled = bodyRecord.enabled as boolean;
  if (hasSilentNotifications) updateFields.silentNotifications = bodyRecord.silentNotifications as boolean;

  try {
    const db = await getDb();
    const [updated] = await db
      .update(schedulerState)
      .set(updateFields)
      .where(eq(schedulerState.jobName, jobName))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Job not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const data: SchedulerJob = {
      jobName: updated.jobName,
      enabled: updated.enabled,
      cronExpression: updated.cronExpression,
      lastRunAt: updated.lastRunAt,
      lastStatus: updated.lastStatus as ScrapeStatus | null,
      lastError: updated.lastError,
      nextRunAt: updated.nextRunAt,
      updatedAt: updated.updatedAt,
      silentNotifications: updated.silentNotifications,
    };

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error({ action: 'scheduler_update_failed', jobName, code: (err as NodeJS.ErrnoException).code });
    return NextResponse.json({ error: 'שגיאה פנימית', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
