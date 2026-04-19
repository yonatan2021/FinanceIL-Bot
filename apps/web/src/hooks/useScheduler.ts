import useSWR from "swr";
import { fetcher, ApiError } from "@/lib/fetcher";
import type { SchedulerJob } from "@finance-bot/types";

export function useScheduler() {
  const { data, error, isLoading, mutate } = useSWR<SchedulerJob[]>(
    "/api/bot/scheduler",
    fetcher,
    { refreshInterval: 60_000 }
  );
  return {
    jobs: data ?? null,
    isLoading,
    isError: !!error,
    errorMessage: error instanceof ApiError ? error.message : error ? "שגיאה לא ידועה" : undefined,
    mutate,
  };
}

export async function updateSchedulerJob(
  jobName: string,
  enabled: boolean
): Promise<SchedulerJob> {
  const res = await fetch(`/api/bot/scheduler/${encodeURIComponent(jobName)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  const json = (await res.json()) as { success: boolean; data?: SchedulerJob; error?: string };
  if (!json.success || !json.data) {
    throw new Error(json.error ?? "שגיאה בעדכון המשרה");
  }
  return json.data;
}
