import useSWR from "swr";
import { fetcher, ApiError } from "@/lib/fetcher";

export interface ScrapeLog {
  id: string;
  startedAt: string;
  status: string;
  transactionsFetched: number | null;
  bankName?: string | null;
}

export function useScrapeLogs(limit?: number) {
  const url = limit !== undefined
    ? `/api/scrape-logs?limit=${limit}`
    : "/api/scrape-logs";
  const { data, error, isLoading, mutate } = useSWR<ScrapeLog[]>(url, fetcher);
  return {
    logs: data ?? [],
    isLoading,
    isError: !!error,
    errorMessage: error instanceof ApiError ? error.message : error ? "שגיאה לא ידועה" : undefined,
    mutate,
  };
}
