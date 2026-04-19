"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const CURRENT_MONTH_HE = new Intl.DateTimeFormat("he-IL", {
  month: "long",
  year: "numeric",
}).format(new Date());

export function TopBar({ title }: { title: string }) {
  const router = useRouter();

  async function handleSignOut() {
    try {
      await authClient.signOut();
    } catch {
      // sign-out best-effort; redirect regardless to force re-auth
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className="h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 flex items-center justify-between px-6 sticky top-0 z-30"
      style={{ boxShadow: "var(--shadow-xs)" }}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-slate-900 tracking-tight">{title}</h1>
        <span className="hidden sm:inline-flex text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
          {CURRENT_MONTH_HE}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="gap-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-sm"
        aria-label="יציאה מהמערכת"
      >
        <LogOut className="h-4 w-4 rtl:scale-x-[-1]" aria-hidden="true" />
        <span className="hidden sm:inline">יציאה</span>
      </Button>
    </header>
  );
}
