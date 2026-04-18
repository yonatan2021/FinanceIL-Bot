"use client";

import { SWRConfig } from "swr";
import { Toaster } from "sonner";
import { fetcher } from "@/lib/fetcher";

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
