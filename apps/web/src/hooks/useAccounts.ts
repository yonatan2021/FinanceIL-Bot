import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

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
  return { accounts: data ?? [], error, isLoading, mutate };
}
