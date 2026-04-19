import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type KpiVariant = "balance" | "income" | "expense" | "net-positive" | "net-negative";

interface KpiCardProps {
  title: string;
  formattedValue: string;
  icon: LucideIcon;
  variant: KpiVariant;
  subtitle?: string;
}

const VARIANT_STYLES: Record<
  KpiVariant,
  { topBorder: string; iconContainer: string; icon: string; value: string }
> = {
  balance: {
    topBorder: "border-t-2 border-t-blue-400",
    iconContainer: "bg-blue-50 ring-1 ring-blue-100",
    icon: "text-blue-600",
    value: "text-slate-900",
  },
  income: {
    topBorder: "border-t-2 border-t-emerald-400",
    iconContainer: "bg-emerald-50 ring-1 ring-emerald-100",
    icon: "text-emerald-600",
    value: "text-emerald-700",
  },
  expense: {
    topBorder: "border-t-2 border-t-red-400",
    iconContainer: "bg-red-50 ring-1 ring-red-100",
    icon: "text-red-500",
    value: "text-red-600",
  },
  "net-positive": {
    topBorder: "border-t-2 border-t-emerald-400",
    iconContainer: "bg-emerald-50 ring-1 ring-emerald-100",
    icon: "text-emerald-600",
    value: "text-emerald-700",
  },
  "net-negative": {
    topBorder: "border-t-2 border-t-red-400",
    iconContainer: "bg-red-50 ring-1 ring-red-100",
    icon: "text-red-500",
    value: "text-red-600",
  },
};

export function KpiCard({
  title,
  formattedValue,
  icon: Icon,
  variant,
  subtitle,
}: KpiCardProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200/80 p-5",
        "hover:shadow-md transition-shadow duration-200",
        styles.topBorder
      )}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 truncate">{title}</p>
          <p
            className={cn("text-2xl font-bold tabular-nums leading-none", styles.value)}
            dir="ltr"
          >
            {formattedValue}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn("p-2.5 rounded-xl shrink-0 mt-0.5", styles.iconContainer)}>
          <Icon className={cn("h-5 w-5", styles.icon)} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
