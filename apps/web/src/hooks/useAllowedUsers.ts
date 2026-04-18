import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export interface AllowedUser {
  id: string;
  name: string | null;
  telegramId: string;
  role: string;
  isActive: boolean | null;
}

export function useAllowedUsers() {
  const { data, error, isLoading, mutate } = useSWR<AllowedUser[]>(
    "/api/users",
    fetcher
  );
  return { users: data ?? [], error, isLoading, mutate };
}
