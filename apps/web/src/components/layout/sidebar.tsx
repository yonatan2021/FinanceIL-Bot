"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  PiggyBank,
  Tag,
  Landmark,
  Bot,
  Users,
  MessageSquare,
  Clock,
  ScrollText,
  BarChart2,
  Settings,
  Bell,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: "סקירה",
    items: [
      { href: "/", label: "דף הבית", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "כספים",
    items: [
      { href: "/transactions", label: "תנועות", icon: CreditCard },
      { href: "/budgets", label: "תקציבים", icon: PiggyBank },
      { href: "/categories", label: "קטגוריות", icon: Tag },
    ],
  },
  {
    label: "בנקים",
    items: [{ href: "/banks", label: "חיבורי בנק", icon: Landmark }],
  },
  {
    label: "שליטה בבוט",
    items: [
      { href: "/bot", label: "סקירת בוט", icon: Bot, exact: true },
      { href: "/bot/users", label: "משתמשים מורשים", icon: Users },
      { href: "/bot/messages", label: "הודעות ושידור", icon: MessageSquare },
      { href: "/bot/scheduler", label: "מתזמן", icon: Clock },
      { href: "/bot/logs", label: "לוגי סקרייפינג", icon: ScrollText },
      { href: "/bot/activity", label: "פעילות פקודות", icon: BarChart2 },
      { href: "/bot/settings", label: "הגדרות בוט", icon: Settings },
    ],
  },
  {
    label: "הגדרות",
    items: [
      { href: "/settings/general", label: "כללי", icon: Settings },
      { href: "/settings/notifications", label: "התראות", icon: Bell },
    ],
  },
];

function isActive(href: string, pathname: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function NavGroup({
  section,
  pathname,
}: {
  section: NavSection;
  pathname: string;
}) {
  return (
    <div>
      <p className="px-3 mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {section.label}
      </p>
      <div className="space-y-0.5">
        {section.items.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, pathname, exact);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 min-h-11",
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-primary" : "text-slate-400"
                )}
                aria-hidden="true"
              />
              <span>{label}</span>
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
    <aside
      className="fixed end-0 top-0 h-screen w-64 bg-white border-s border-slate-200 flex flex-col z-40 shadow-sm"
      aria-label="ניווט ראשי"
    >
      {/* Brand header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 group-hover:bg-primary/90 transition-colors">
            <Wallet className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-sm text-slate-900">FinanceIL</p>
            <p className="text-xs text-slate-400 font-normal">Bot Dashboard</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 px-3 py-4 overflow-y-auto space-y-5"
        aria-label="תפריט ניווט"
      >
        {NAV_SECTIONS.map((section) => (
          <NavGroup key={section.label} section={section} pathname={pathname} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 shrink-0">
        <p className="text-xs text-slate-400 text-center">FinanceIL-Bot v0.1</p>
      </div>
    </aside>
  );
}
