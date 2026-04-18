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

const NAV_MAIN = [
  { href: "/", label: "לוח בקרה", icon: LayoutDashboard },
  { href: "/transactions", label: "עסקאות", icon: CreditCard },
  { href: "/budgets", label: "תקציבים", icon: PiggyBank },
  { href: "/banks", label: "בנקים", icon: Landmark },
] as const;

const NAV_ADMIN = [
  { href: "/users", label: "משתמשים", icon: Users },
  { href: "/bot", label: "ניהול בוט", icon: Bot },
  { href: "/logs", label: "יומן", icon: ScrollText },
] as const;

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

function NavGroup({ label, items, pathname }: { label: string; items: readonly NavItem[]; pathname: string }) {
  return (
    <div>
      <p className="px-3 mb-1.5 text-xs font-semibold text-slate-400">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map(({ href, label: itemLabel, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-primary" : "text-slate-400"
                )}
              />
              <span>{itemLabel}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed end-0 top-0 h-screen w-64 bg-white border-s border-slate-200 flex flex-col z-40 shadow-sm">
      {/* Brand header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 group-hover:bg-primary/90 transition-colors">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-sm text-slate-900">FinanceIL</p>
            <p className="text-xs text-slate-400 font-normal">Bot Dashboard</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        <NavGroup label="ראשי" items={NAV_MAIN} pathname={pathname} />
        <NavGroup label="ניהול" items={NAV_ADMIN} pathname={pathname} />
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 shrink-0">
        <p className="text-xs text-slate-400 text-center">FinanceIL-Bot v0.1</p>
      </div>
    </aside>
  );
}
