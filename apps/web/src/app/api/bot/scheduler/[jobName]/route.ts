export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { schedulerState } from "@finance-bot/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import type { SchedulerJob } from "@finance-bot/types";

const KNOWN_JOBS = ['daily-budget-alerts', 'weekly-summary', 'monthly-report'] as const;
type KnownJob = typeof KNOWN_JOBS[number];

function isKnownJob(value: string): value is KnownJob {
  return (KNOWN_JOBS as readonly string[]).includes(value);
}

const UpdateJobSchema = z
  .object({
    enabled: z.boolean().optional(),
    silentNotifications: z.boolean().optional(),
  })
  .refine(
    (d) => d.enabled !== undefined || d.silentNotifications !== undefined,
    { message: 'Body must include at least one of { enabled: boolean, silentNotifications: boolean }' },
  );

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ jobName: string }> },
): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { jobName } = await params;

  if (!isKnownJob(jobName)) {
    return NextResponse.json(
      { success: false, error: 'Unknown job name', code: 'INVALID_PARAMS' },
      { status: 400 },
    );
  }

  const rawBody: unknown = await req.json().catch(() => null);
  const parsed = UpdateJobSchema.safeParse(rawBody);

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Invalid request body',
        code: 'INVALID_PARAMS',
      },
      { status: 400 },
    );
  }

  try {
    const db = await getDb();

    // Check existence before mutating — avoids a blind UPDATE on a non-existent row.
    const existing = await db
      .select()
      .from(schedulerState)
      .where(eq(schedulerState.jobName, jobName));

    if (existing.length === 0) {
      return NextResponse.json({ success: false, error: 'Job not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const updateFields: { updatedAt: Date; enabled?: boolean; silentNotifications?: boolean } = {
      updatedAt: new Date(),
    };
    if (parsed.data.enabled !== undefined) updateFields.enabled = parsed.data.enabled;
    if (parsed.data.silentNotifications !== undefined) updateFields.silentNotifications = parsed.data.silentNotifications;

    const [updated] = await db
      .update(schedulerState)
      .set(updateFields)
      .where(eq(schedulerState.jobName, jobName))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Job not found', code: 'NOT_FOUND' }, { status: 404 });
    }

    const data: SchedulerJob = {
      jobName: updated.jobName,
      enabled: updated.enabled,
      cronExpression: updated.cronExpression,
      lastRunAt: updated.lastRunAt,
      lastStatus: updated.lastStatus,
      lastError: updated.lastError,
      nextRunAt: updated.nextRunAt,
      updatedAt: updated.updatedAt,
      silentNotifications: updated.silentNotifications,
    };

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error({ action: 'scheduler_update_failed', jobName, code: (err as NodeJS.ErrnoException).code });
    return NextResponse.json({ success: false, error: 'שגיאה פנימית', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
