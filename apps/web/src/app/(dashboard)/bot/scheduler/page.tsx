"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Switch } from "@/components/ui/switch";
import { TableSkeleton } from "@/components/ui/page-skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { SchedulerJob } from "@finance-bot/types";
import { useScheduler, updateSchedulerJob } from "@/hooks/useScheduler";

const JOB_NAME_HE: Record<string, string> = {
  'daily-budget-alerts': 'התראות תקציב יומיות',
  'weekly-summary': 'סיכום שבועי',
  'monthly-report': 'דוח חודשי',
};

function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('he-IL');
}

function StatusPill({ status }: { status: string | null }) {
  if (!status) {
    return <Badge variant="outline">לא רץ</Badge>;
  }
  if (status === 'success') {
    return <Badge className="bg-green-600 hover:bg-green-600 text-white">הצלחה</Badge>;
  }
  if (status === 'error') {
    return <Badge variant="destructive">שגיאה</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

export default function SchedulerPage() {
  const { jobs, error, mutate } = useScheduler();
  const [toggling, setToggling] = useState<Set<string>>(new Set());
  const [togglingSilent, setTogglingSilent] = useState<Set<string>>(new Set());

  const handleToggle = async (jobName: string, currentEnabled: boolean) => {
    setToggling((prev) => new Set(prev).add(jobName));
    try {
      const updatedJob = await updateSchedulerJob(jobName, { enabled: !currentEnabled });
      await mutate((prev) =>
        prev === undefined
          ? undefined
          : prev.map((j): SchedulerJob =>
              j.jobName === jobName ? { ...j, enabled: updatedJob.enabled } : j
            ),
        { revalidate: false }
      );
      toast.success('עודכן');
    } catch (err) {
      await mutate(); // revalidate to restore true server state
      toast.error(err instanceof Error ? err.message : 'שגיאה בעדכון המשרה');
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(jobName);
        return next;
      });
    }
  };

  const handleSilentToggle = async (jobName: string, currentSilent: boolean) => {
    setTogglingSilent((prev) => new Set(prev).add(jobName));
    try {
      const updatedJob = await updateSchedulerJob(jobName, { silentNotifications: !currentSilent });
      await mutate((prev) =>
        prev === undefined
          ? undefined
          : prev.map((j): SchedulerJob =>
              j.jobName === jobName ? { ...j, silentNotifications: updatedJob.silentNotifications } : j
            ),
        { revalidate: false }
      );
      toast.success('עודכן');
    } catch (err) {
      await mutate(); // revalidate to restore true server state
      toast.error(err instanceof Error ? err.message : 'שגיאה בעדכון המשרה');
    } finally {
      setTogglingSilent((prev) => {
        const next = new Set(prev);
        next.delete(jobName);
        return next;
      });
    }
  };

  return (
    <div>
      <TopBar title="מתזמן" />
      <div className="p-6">
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
            שגיאה בטעינת הנתונים.{" "}
            <button
              onClick={() => void mutate()}
              className="underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
            >
              נסה שוב
            </button>
          </div>
        ) : jobs === null ? (
          <TableSkeleton rows={3} cols={7} />
        ) : (
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-end">שם משרה</TableHead>
                  <TableHead className="text-right" dir="ltr">ביטוי Cron</TableHead>
                  <TableHead className="text-end">סטטוס</TableHead>
                  <TableHead className="text-end">ריצה אחרונה</TableHead>
                  <TableHead className="text-end">ריצה הבאה</TableHead>
                  <TableHead className="text-end">מופעל</TableHead>
                  <TableHead className="text-end">הודעה שקטה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.jobName}>
                    <TableCell className="font-medium">
                      {JOB_NAME_HE[job.jobName] ?? job.jobName}
                    </TableCell>
                    <TableCell dir="ltr" className="font-mono text-sm text-muted-foreground">
                      {job.cronExpression}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={job.lastStatus} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(job.lastRunAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(job.nextRunAt)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={job.enabled}
                        disabled={toggling.has(job.jobName)}
                        onCheckedChange={() => void handleToggle(job.jobName, job.enabled)}
                        aria-label={`הפעל / כבה: ${JOB_NAME_HE[job.jobName] ?? job.jobName}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={job.silentNotifications}
                        disabled={togglingSilent.has(job.jobName)}
                        onCheckedChange={() => void handleSilentToggle(job.jobName, job.silentNotifications)}
                        aria-label={`הודעה שקטה: ${JOB_NAME_HE[job.jobName] ?? job.jobName}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
