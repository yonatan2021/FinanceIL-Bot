"use client";

import { SWRConfig } from "swr";
import { Toaster } from "sonner";

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => {
      if (!json.success) {
        const err = new Error(json.error ?? "שגיאה לא ידועה") as Error & {
          code?: string;
        };
        err.code = json.code;
        throw err;
      }
      return json.data;
    });

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{ fetcher, revalidateOnFocus: false }}>
      {children}
      <Toaster
        dir="rtl"
        position="bottom-left"
        richColors
        closeButton
        duration={4000}
      />
    </SWRConfig>
  );
}
