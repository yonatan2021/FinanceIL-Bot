import useSWR from "swr";
import { fetcher, ApiError } from "@/lib/fetcher";

export interface Account {
  id: string;
  credentialId: string;
  accountNumber: string | null;
  balance: number | null;
  lastUpdatedAt: string | null;
}

export function useAccounts() {
  const { data, error, isLoading, mutate } = useSWR<Account[]>(
    "/api/accounts",
    fetcher
  );
  return {
    accounts: data ?? [],
    isLoading,
    isError: !!error,
    errorMessage: error instanceof ApiError ? error.message : error ? "שגיאה לא ידועה" : undefined,
    mutate,
  };
}
