import useSWR from "swr";
import { fetcher, ApiError } from "@/lib/fetcher";

export interface BotHealthData {
  id: number;
  lastBeatAt: string | null;
  pid: number | null;
  memoryMb: number | null;
  uptimeSec: number | null;
  lastError: string | null;
  lastErrorAt: string | null;
  status: "online" | "stale";
}

export function useBotHealth() {
  const { data, error, isLoading, mutate } = useSWR<BotHealthData | null>(
    "/api/bot/health",
    fetcher,
    { refreshInterval: 15_000 }
  );
  // isLoading=true → undefined (initial), isLoading=false+no error → data (may be null)
  return {
    health: isLoading ? undefined : (data ?? null),
    isLoading,
    isError: !!error,
    errorMessage: error instanceof ApiError ? error.message : error ? "שגיאה לא ידועה" : undefined,
    mutate,
  };
}
