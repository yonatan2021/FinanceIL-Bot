import useSWR from "swr";
import { fetcher, ApiError } from "@/lib/fetcher";
import type { BotHeartbeatWithStatus } from "@finance-bot/types";

export type { BotHeartbeatWithStatus as BotHealthData };

export function useBotHealth() {
  const { data, error, isLoading, mutate } = useSWR<BotHeartbeatWithStatus | null>(
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
