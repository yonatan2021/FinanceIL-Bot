import useSWR from "swr";
import { fetcher, ApiError } from "@/lib/fetcher";

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  type: string | null;
  category: string | null;
  status: string | null;
}

export function useTransactions(month: string) {
  const { data, error, isLoading, mutate } = useSWR<Transaction[]>(
    month ? `/api/transactions/list?month=${month}` : null,
    fetcher
  );
  return {
    transactions: data ?? [],
    isLoading,
    isError: !!error,
    errorMessage: error instanceof ApiError ? error.message : error ? "שגיאה לא ידועה" : undefined,
    mutate,
  };
}
