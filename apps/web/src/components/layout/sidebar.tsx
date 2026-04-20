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
      <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400/70 select-none">
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
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 min-h-11",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                active
                  ? "bg-blue-50 text-primary font-semibold"
                  : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-800"
              )}
            >
              {active && (
                <span
                  className="absolute inset-y-1 start-0 w-0.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  active ? "text-primary" : "text-slate-400"
                )}
                aria-hidden="true"
              />
              <span className="truncate">{label}</span>
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
      className="fixed start-0 top-0 h-screen w-64 bg-white border-e border-slate-200/80 flex flex-col z-40"
      style={{ boxShadow: "var(--shadow-md)" }}
      aria-label="ניווט ראשי"
    >
      <div className="h-16 flex items-center px-4 border-b border-slate-100 shrink-0 bg-gradient-to-b from-white to-slate-50/50">
        <Link href="/" className="flex items-center gap-3 group w-full">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-shadow duration-200">
            <Wallet className="h-[18px] w-[18px] text-white" aria-hidden="true" />
          </div>
          <div className="leading-tight min-w-0">
            <p className="font-bold text-sm text-slate-900 tracking-tight">FinanceIL</p>
            <p className="text-[11px] text-slate-400 font-normal">לוח בקרה פיננסי</p>
          </div>
        </Link>
      </div>

      <nav
        className="flex-1 px-2 py-4 overflow-y-auto space-y-5"
        aria-label="תפריט ניווט"
      >
        {NAV_SECTIONS.map((section) => (
          <NavGroup key={section.label} section={section} pathname={pathname} />
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-slate-100 shrink-0 bg-slate-50/50">
        <p className="text-[10px] text-slate-400/70 text-center tracking-wide">
          FinanceIL-Bot v0.1
        </p>
      </div>
    </aside>
  );
}
