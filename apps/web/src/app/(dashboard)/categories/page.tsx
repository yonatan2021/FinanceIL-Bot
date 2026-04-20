"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { fetcher } from "@/lib/fetcher";
import { TopBar } from "@/components/layout/top-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tag, Trash2, Plus } from "lucide-react";
import type { CategorySummary } from "@/app/api/categories/route";
import type { CategoryRule } from "@finance-bot/types";

interface CategoriesResponse {
  success: boolean;
  data: CategorySummary[];
}

interface RulesResponse {
  success: boolean;
  data: CategoryRule[];
}

interface AddRuleFormState {
  categoryName: string;
  pattern: string;
  priority: string;
}

const DEFAULT_FORM: AddRuleFormState = {
  categoryName: "",
  pattern: "",
  priority: "0",
};

export default function CategoriesPage() {
  const {
    data: categoriesData,
    error: categoriesError,
    isLoading: categoriesLoading,
  } = useSWR<CategoriesResponse>("/api/categories", fetcher);

  const {
    data: rulesData,
    error: rulesError,
    isLoading: rulesLoading,
    mutate: mutateRules,
  } = useSWR<RulesResponse>("/api/categories/rules", fetcher);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<AddRuleFormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());

  function updateForm(field: keyof AddRuleFormState, value: string) {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/categories/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryName: formState.categoryName,
          pattern: formState.pattern,
          priority: parseInt(formState.priority, 10) || 0,
        }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) {
        toast.error(json.error ?? "שגיאה בשמירת הכלל");
        return;
      }
      toast.success("כלל נוסף בהצלחה");
      setDialogOpen(false);
      setFormState(DEFAULT_FORM);
      await mutateRules();
    } catch {
      toast.error("שגיאת רשת");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(rule: CategoryRule) {
    setTogglingIds((prev) => new Set(prev).add(rule.id));
    try {
      const res = await fetch(`/api/categories/rules/${rule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) {
        toast.error(json.error ?? "שגיאה בעדכון הכלל");
        return;
      }
      toast.success("כלל עודכן");
      await mutateRules();
    } catch {
      toast.error("שגיאת רשת");
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(rule.id);
        return next;
      });
    }
  }

  async function handleDelete(rule: CategoryRule) {
    if (!window.confirm(`למחוק את הכלל "${rule.pattern}"?`)) return;
    setDeletingIds((prev) => new Set(prev).add(rule.id));
    try {
      const res = await fetch(`/api/categories/rules/${rule.id}`, { method: "DELETE" });
      const json = (await res.json()) as { success: boolean; error?: string };
      if (!json.success) {
        toast.error(json.error ?? "שגיאה במחיקת הכלל");
        return;
      }
      toast.success("כלל נמחק");
      await mutateRules();
    } catch {
      toast.error("שגיאת רשת");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(rule.id);
        return next;
      });
    }
  }

  const categories = categoriesData?.data ?? [];
  const rules = rulesData?.data ?? [];

  return (
    <div>
      <TopBar title="קטגוריות" />
      <div className="p-6 space-y-8">

        {/* Section 1: Categories overview */}
        <section className="space-y-4">
          <h2 className="font-semibold text-base">קטגוריות פעילות</h2>

          {categoriesError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
              שגיאה בטעינת קטגוריות.
            </div>
          )}

          {categoriesLoading && <TableSkeleton rows={4} cols={3} />}

          {!categoriesLoading && !categoriesError && (
            categories.length === 0 ? (
              <EmptyState
                icon={Tag}
                title="אין קטגוריות עדיין"
                description="קטגוריות ייווצרו אוטומטית כאשר תיובאנה עסקאות"
              />
            ) : (
              <div className="rounded-md border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-start">קטגוריה</TableHead>
                      <TableHead className="text-start">עסקאות</TableHead>
                      <TableHead className="text-start">תקציב</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat) => (
                      <TableRow key={cat.name}>
                        <TableCell className="font-medium">{cat.name}</TableCell>
                        <TableCell>{cat.transactionCount}</TableCell>
                        <TableCell>
                          {cat.hasBudget ? (
                            <Badge className="bg-green-600 hover:bg-green-600 text-white">
                              פעיל
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          )}
        </section>

        {/* Section 2: Auto-categorization rules */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="font-semibold text-base">כללי קטגוריזציה אוטומטית</h2>
              <p className="text-sm text-muted-foreground">
                כללים מופעלים אוטומטית על עסקאות חדשות לפי סדר עדיפות (מספר נמוך = עדיפות גבוהה).
              </p>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              size="sm"
              className="gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              הוסף כלל
            </Button>
          </div>

          {rulesError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
              שגיאה בטעינת כללים.
            </div>
          )}

          {rulesLoading && <TableSkeleton rows={3} cols={4} />}

          {!rulesLoading && !rulesError && (
            rules.length === 0 ? (
              <EmptyState
                icon={Tag}
                title="אין כללי קטגוריזציה"
                description="הוסף כלל כדי לסווג עסקאות אוטומטית"
                action={{ label: "הוסף כלל", onClick: () => setDialogOpen(true) }}
              />
            ) : (
              <div className="rounded-md border bg-white divide-y">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-xs text-muted-foreground w-6 text-end shrink-0">
                        {rule.priority}
                      </span>
                      <code className="text-sm bg-slate-100 px-2 py-0.5 rounded font-mono truncate max-w-48" dir="ltr">
                        {rule.pattern}
                      </code>
                      <span className="text-muted-foreground text-sm shrink-0">→</span>
                      <span className="font-medium text-sm truncate">{rule.categoryName}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Switch
                        checked={rule.isActive}
                        disabled={togglingIds.has(rule.id)}
                        onCheckedChange={() => void handleToggle(rule)}
                        aria-label={`הפעל / כבה: ${rule.categoryName}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingIds.has(rule.id)}
                        onClick={() => void handleDelete(rule)}
                        aria-label={`מחיקת כלל: ${rule.pattern}`}
                        className="text-destructive hover:text-destructive focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </section>
      </div>

      {/* Add Rule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>הוסף כלל קטגוריזציה</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void handleAddRule(e)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="rule-category">קטגוריה</Label>
              <Input
                id="rule-category"
                value={formState.categoryName}
                onChange={(e) => updateForm("categoryName", e.target.value)}
                placeholder="לדוגמה: מזון"
                required
                className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-pattern">תבנית (regex)</Label>
              <Input
                id="rule-pattern"
                dir="ltr"
                value={formState.pattern}
                onChange={(e) => updateForm("pattern", e.target.value)}
                placeholder=".*סופרמרקט.*"
                required
                className="font-mono focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-priority">עדיפות</Label>
              <Input
                id="rule-priority"
                type="number"
                value={formState.priority}
                onChange={(e) => updateForm("priority", e.target.value)}
                className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {submitting ? "שומר..." : "שמור"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
