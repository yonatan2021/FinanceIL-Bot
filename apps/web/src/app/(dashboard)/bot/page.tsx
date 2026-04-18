"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface BotStatus {
  ok: boolean;
  botName?: string;
  username?: string;
  error?: string;
}

interface ScrapeLog {
  id: string;
  startedAt: string;
  status: string;
  transactionsFetched: number | null;
  bankName?: string | null;
}

export default function BotOverviewPage() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [recentLogs, setRecentLogs] = useState<ScrapeLog[]>([]);
  const [scrapeLoading, setScrapeLoading] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/bot/status");
      setStatus((await res.json()) as BotStatus);
    } catch {
      setStatus({ ok: false, error: "שגיאת רשת" });
    }
  }, []);

  const fetchRecentLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/scrape-logs");
      if (!res.ok) {
        setRecentLogs([]);
        return;
      }
      const data = (await res.json()) as { success: boolean; data?: ScrapeLog[] };
      setRecentLogs((data.data ?? []).slice(0, 3));
    } catch {
      setRecentLogs([]);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
    void fetchRecentLogs();
    const interval = setInterval(() => void fetchStatus(), 30_000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchRecentLogs]);

  const handleScrape = async () => {
    setScrapeLoading(true);
    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      const data = (await res.json()) as { success: boolean; error?: string };
      if (data.success) {
        toast.success("הסקרייפר הסתיים בהצלחה");
        void fetchRecentLogs();
      } else {
        toast.error(`שגיאה: ${data.error ?? "לא ידוע"}`);
      }
    } catch {
      toast.error("שגיאת רשת");
    }
    setScrapeLoading(false);
  };

  return (
    <div>
      <TopBar title="סקירת בוט" />
      <div className="p-6 space-y-6">

        {/* Bot status card */}
        <section className="rounded-lg border bg-white p-5 space-y-3">
          <h2 className="font-semibold text-base">סטטוס בוט</h2>
          {status === null ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent" />
              בודק...
            </div>
          ) : status.ok ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600 hover:bg-green-600">
                  Online
                </Badge>
                <span className="text-sm font-medium">{status.botName}</span>
                {status.username && (
                  <span className="text-sm text-muted-foreground" dir="ltr">
                    @{status.username}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <Badge variant="destructive">
              Offline{status.error ? ` — ${status.error}` : ""}
            </Badge>
          )}

          {/* Health/next run placeholder */}
          <div className="grid grid-cols-2 gap-4 pt-1 text-sm text-muted-foreground">
            <div>
              <span className="block text-xs uppercase tracking-wide mb-0.5">בריאות מערכת</span>
              <span>—</span>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wide mb-0.5">ריצה הבאה</span>
              <span>—</span>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section className="space-y-2">
          <h2 className="font-semibold text-base">פעולות מהירות</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              variant="outline"
              className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Link href="/bot/messages">שדר הודעה</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleScrape()}
              disabled={scrapeLoading}
              className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {scrapeLoading ? "מריץ..." : "הרץ סקרייפר"}
            </Button>
            <Button
              asChild
              variant="outline"
              className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Link href="/bot/users">משתמשים</Link>
            </Button>
          </div>
        </section>

        {/* Recent scrape logs */}
        <section className="rounded-lg border bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">ריצות אחרונות</h2>
            <Link
              href="/bot/logs"
              className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
            >
              כל הלוגים ←
            </Link>
          </div>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין ריצות אחרונות</p>
          ) : (
            <ul className="space-y-2">
              {recentLogs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-center justify-between text-sm border-b last:border-b-0 pb-2 last:pb-0"
                >
                  <span className="text-muted-foreground">
                    {new Date(log.startedAt).toLocaleString("he-IL")}
                    {log.bankName ? ` · ${log.bankName}` : ""}
                  </span>
                  <div className="flex items-center gap-2">
                    {log.transactionsFetched != null && (
                      <span className="text-xs text-muted-foreground" dir="ltr">
                        {log.transactionsFetched} עסקאות
                      </span>
                    )}
                    <span
                      className={
                        log.status === "success"
                          ? "text-green-700 font-medium"
                          : log.status === "error"
                          ? "text-destructive font-medium"
                          : "text-amber-600 font-medium"
                      }
                    >
                      {log.status === "success"
                        ? "הצלחה"
                        : log.status === "error"
                        ? "שגיאה"
                        : log.status === "partial"
                        ? "חלקי"
                        : log.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </div>
  );
}
