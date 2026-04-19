import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { SchedulerJob } from "@finance-bot/types";

export function useScheduler() {
  const { data, error, isLoading, mutate } = useSWR<SchedulerJob[]>(
    "/api/bot/scheduler",
    fetcher,
    { refreshInterval: 60_000 }
  );
  return { jobs: data ?? null, error, isLoading, mutate };
}

// Require at least one of the two updatable fields — mirrors the server-side Zod refine.
type UpdateFields =
  | { enabled: boolean; silentNotifications?: boolean }
  | { enabled?: boolean; silentNotifications: boolean };

export async function updateSchedulerJob(
  jobName: string,
  fields: UpdateFields,
): Promise<SchedulerJob> {
  const res = await fetch(`/api/bot/scheduler/${encodeURIComponent(jobName)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
  const json = (await res.json()) as { success: boolean; data?: SchedulerJob; error?: string };
  if (!json.success || !json.data) {
    throw new Error(json.error ?? "שגיאה בעדכון המשרה");
  }
  return json.data;
}
