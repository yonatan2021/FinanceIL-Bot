import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  { iconContainer: string; icon: string; value: string }
> = {
  balance: {
    iconContainer: "bg-blue-50",
    icon: "text-blue-600",
    value: "text-slate-900",
  },
  income: {
    iconContainer: "bg-emerald-50",
    icon: "text-emerald-600",
    value: "text-emerald-700",
  },
  expense: {
    iconContainer: "bg-red-50",
    icon: "text-red-500",
    value: "text-red-600",
  },
  "net-positive": {
    iconContainer: "bg-emerald-50",
    icon: "text-emerald-600",
    value: "text-emerald-700",
  },
  "net-negative": {
    iconContainer: "bg-red-50",
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
    <Card className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
            <p
              className={cn(
                "text-2xl font-bold tabular-nums leading-none",
                styles.value
              )}
              dir="ltr"
            >
              {formattedValue}
            </p>
            {subtitle && (
              <p className="text-xs text-slate-400">{subtitle}</p>
            )}
          </div>
          <div className={cn("p-2.5 rounded-xl shrink-0", styles.iconContainer)}>
            <Icon className={cn("h-5 w-5", styles.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
