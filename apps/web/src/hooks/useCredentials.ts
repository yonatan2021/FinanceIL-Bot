import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export interface SafeCredential {
  id: string;
  displayName: string;
  bankId: string;
  status: string | null;
  lastScrapedAt: string | null;
}

export function useCredentials() {
  const { data, error, isLoading, mutate } = useSWR<SafeCredential[]>(
    "/api/credentials",
    fetcher
  );
  return { credentials: data ?? [], error, isLoading, mutate };
}
