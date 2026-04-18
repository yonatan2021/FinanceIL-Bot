import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

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
  return { logs: data ?? [], error, isLoading, mutate };
}
