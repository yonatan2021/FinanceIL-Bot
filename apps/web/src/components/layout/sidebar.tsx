"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  PiggyBank,
  Landmark,
  Users,
  ScrollText,
  Wallet,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/transactions", label: "עסקאות", icon: CreditCard },
  { href: "/budgets", label: "תקציבים", icon: PiggyBank },
  { href: "/banks", label: "בנקים", icon: Landmark },
  { href: "/users", label: "משתמשים", icon: Users },
  { href: "/bot", label: "ניהול בוט", icon: Bot },
  { href: "/logs", label: "יומן", icon: ScrollText },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed end-0 top-0 h-screen w-64 bg-white border-s border-slate-200 flex flex-col z-40">
      <div className="h-16 flex items-center px-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary shrink-0" />
          <span className="font-bold text-lg text-slate-900">פיננסים</span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary border-s-2 border-primary"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
