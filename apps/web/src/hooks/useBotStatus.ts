import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

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
  return { status: data ?? null, error, isLoading, mutate };
}
