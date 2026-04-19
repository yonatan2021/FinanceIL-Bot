import useSWR from "swr";
import { fetcher, ApiError } from "@/lib/fetcher";

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
  return {
    credentials: data ?? [],
    isLoading,
    isError: !!error,
    errorMessage: error instanceof ApiError ? error.message : error ? "שגיאה לא ידועה" : undefined,
    mutate,
  };
}
