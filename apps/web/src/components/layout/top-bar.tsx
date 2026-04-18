"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

function currentMonthHE(): string {
  return new Intl.DateTimeFormat("he-IL", {
    month: "long",
    year: "numeric",
  }).format(new Date());
}

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
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        <span className="hidden sm:inline-flex text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
          {currentMonthHE()}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="gap-2 text-slate-500 hover:text-slate-700"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">יציאה</span>
      </Button>
    </header>
  );
}
