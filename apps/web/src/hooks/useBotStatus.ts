import useSWR from "swr";
import { fetcher, ApiError } from "@/lib/fetcher";

export interface BotStatus {
  ok: boolean;
  botName?: string;
  username?: string;
  error?: string;
}

export function useBotStatus() {
  const { data, error, isLoading, mutate } = useSWR<BotStatus>(
    "/api/bot/status",
    fetcher,
    { refreshInterval: 30_000 }
  );
  return {
    status: data ?? null,
    isLoading,
    isError: !!error,
    errorMessage: error instanceof ApiError ? error.message : error ? "שגיאה לא ידועה" : undefined,
    mutate,
  };
}
