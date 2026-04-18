"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [jobs, setJobs] = useState<SchedulerJob[] | null>(null);
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/bot/scheduler');
      if (!res.ok) {
        toast.error('שגיאה בטעינת המתזמן');
        return;
      }
      const data = (await res.json()) as { success: boolean; data?: SchedulerJob[] };
      setJobs(data.data ?? []);
    } catch {
      toast.error('שגיאת רשת');
    }
  }, []);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  const handleToggle = async (jobName: string, currentEnabled: boolean) => {
    setToggling((prev) => new Set(prev).add(jobName));
    try {
      const res = await fetch(`/api/bot/scheduler/${encodeURIComponent(jobName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (!res.ok) {
        toast.error('שגיאה בעדכון המשרה');
        return;
      }
      const data = (await res.json()) as { success: boolean; data?: SchedulerJob };
      if (data.success && data.data) {
        setJobs((prev) =>
          prev === null
            ? null
            : prev.map((j) => (j.jobName === jobName ? { ...j, enabled: data.data!.enabled } : j)),
        );
        toast.success('עודכן');
      } else {
        toast.error('שגיאה בעדכון המשרה');
      }
    } catch {
      toast.error('שגיאת רשת');
    } finally {
      setToggling((prev) => {
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
        {jobs === null ? (
          <TableSkeleton rows={3} cols={6} />
        ) : (
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שם משרה</TableHead>
                  <TableHead className="text-right" dir="ltr">ביטוי Cron</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">ריצה אחרונה</TableHead>
                  <TableHead className="text-right">ריצה הבאה</TableHead>
                  <TableHead className="text-right">מופעל</TableHead>
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
