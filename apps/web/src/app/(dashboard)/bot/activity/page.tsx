"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { TopBar } from "@/components/layout/top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/page-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bot } from "lucide-react";
import type { ActivityEntry } from "@/app/api/bot/activity/route";

interface ActivityMeta {
  totalCommands: number;
  uniqueUsers: number;
  successRate: number | null;
  rangeDays: number;
}

interface ActivityResponse {
  success: boolean;
  data: ActivityEntry[];
  meta: ActivityMeta;
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString("he-IL");
}

export default function BotActivityPage() {
  const { data, error, isLoading, mutate } = useSWR<ActivityResponse>(
    "/api/bot/activity?range=7d",
    fetcher,
    { refreshInterval: 60_000 }
  );

  return (
    <div>
      <TopBar title="פעילות פקודות" />
      <div className="p-6 space-y-6">

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
            שגיאה בטעינת הנתונים.{" "}
            <button
              onClick={() => void mutate()}
              className="underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
            >
              נסה שוב
            </button>
          </div>
        )}

        {isLoading && <TableSkeleton rows={5} cols={4} />}

        {!isLoading && !error && data?.meta && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "סה״כ פקודות (7 ימים)",
                  value: String(data.meta.totalCommands),
                },
                {
                  label: "משתמשים ייחודיים",
                  value: String(data.meta.uniqueUsers),
                },
                {
                  label: "אחוז הצלחה",
                  value: data.meta.successRate !== null
                    ? `${data.meta.successRate}%`
                    : "—",
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-1"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                >
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {label}
                  </p>
                  <p className="text-2xl font-bold text-slate-900 tabular-nums" dir="ltr">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Commands table */}
            {data.data.length === 0 ? (
              <EmptyState
                icon={Bot}
                title="עוד אין נתוני פעילות"
                description="כשהבוט יקבל פקודות, הנתונים יופיעו כאן."
              />
            ) : (
              <div className="rounded-md border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-start">פקודה</TableHead>
                      <TableHead className="text-start">מספר שימושים</TableHead>
                      <TableHead className="text-start">משך ממוצע</TableHead>
                      <TableHead className="text-start">שימוש אחרון</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((entry) => (
                      <TableRow key={entry.command}>
                        <TableCell className="font-mono font-medium" dir="ltr">
                          /{entry.command}
                        </TableCell>
                        <TableCell>{entry.count}</TableCell>
                        <TableCell>{formatDuration(entry.avgDurationMs)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(entry.lastUsed)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
