import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { BotConfig } from "@finance-bot/types";

export function useBotConfig() {
  const { data, error, isLoading, mutate } = useSWR<BotConfig>(
    "/api/bot/config",
    fetcher
  );
  return { config: data ?? null, error, isLoading, mutate };
}

export async function updateBotConfig(
  fields: Partial<Omit<BotConfig, 'id' | 'updatedAt'>>
): Promise<BotConfig> {
  const res = await fetch('/api/bot/config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  const json = (await res.json()) as { success: boolean; data?: BotConfig; error?: string };
  if (!json.success || !json.data) {
    throw new Error(json.error ?? 'שגיאה בעדכון הגדרות');
  }
  return json.data;
}
