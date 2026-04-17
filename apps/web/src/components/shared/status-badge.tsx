import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "success" | "error" | "partial" | "active" | "disabled";

const STATUS_MAP: Record<Status, { label: string; className: string }> = {
  success: { label: "הצלחה", className: "bg-green-100 text-green-800 border-green-200" },
  error: { label: "שגיאה", className: "bg-red-100 text-red-800 border-red-200" },
  partial: { label: "חלקי", className: "bg-amber-100 text-amber-800 border-amber-200" },
  active: { label: "פעיל", className: "bg-blue-100 text-blue-800 border-blue-200" },
  disabled: { label: "מושבת", className: "bg-slate-100 text-slate-600 border-slate-200" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status as Status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-600",
  };

  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
