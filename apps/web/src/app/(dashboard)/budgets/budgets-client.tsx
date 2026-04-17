"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Budget {
  id: string;
  categoryName: string;
  monthlyLimit: number;
  alertThreshold: number | null;
  isActive: boolean | null;
  createdAt: Date | null;
}

interface Props {
  initialBudgets: Budget[];
}

export function BudgetsClient({ initialBudgets }: Props) {
  const [budgetList, setBudgetList] = useState<Budget[]>(initialBudgets);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [form, setForm] = useState({
    categoryName: "",
    monthlyLimit: "",
    alertThreshold: "80",
  });

  const fmt = new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
  });

  function openCreate() {
    setEditing(null);
    setForm({ categoryName: "", monthlyLimit: "", alertThreshold: "80" });
    setDialogOpen(true);
  }

  function openEdit(budget: Budget) {
    setEditing(budget);
    setForm({
      categoryName: budget.categoryName,
      monthlyLimit: String(budget.monthlyLimit),
      alertThreshold: String(Math.round((budget.alertThreshold ?? 0.8) * 100)),
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      categoryName: form.categoryName,
      monthlyLimit: Number(form.monthlyLimit),
      alertThreshold: Number(form.alertThreshold) / 100,
    };

    if (editing) {
      const res = await fetch(`/api/budgets/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setBudgetList((prev) =>
          prev.map((b) => (b.id === editing.id ? json.data : b))
        );
      }
    } else {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setBudgetList((prev) => [...prev, json.data]);
      }
    }

    setDialogOpen(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק קטגוריה זו?")) return;
    const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      setBudgetList((prev) => prev.filter((b) => b.id !== id));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              קטגוריה חדשה
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>
                {editing ? "עריכת קטגוריה" : "קטגוריה חדשה"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="cat-name">שם קטגוריה</Label>
                <Input
                  id="cat-name"
                  value={form.categoryName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, categoryName: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-limit">תקרה חודשית (₪)</Label>
                <Input
                  id="cat-limit"
                  type="number"
                  min={0}
                  step={0.01}
                  dir="ltr"
                  value={form.monthlyLimit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, monthlyLimit: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-threshold">
                  סף התראה (%)
                </Label>
                <Input
                  id="cat-threshold"
                  type="number"
                  min={1}
                  max={100}
                  dir="ltr"
                  value={form.alertThreshold}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, alertThreshold: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  ביטול
                </Button>
                <Button type="submit">שמירה</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgetList
          .filter((b) => b.isActive)
          .map((budget) => (
            <Card key={budget.id}>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">{budget.categoryName}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEdit(budget)}
                    aria-label="עריכה"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(budget.id)}
                    aria-label="מחיקה"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold" dir="ltr">
                  {fmt.format(budget.monthlyLimit)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  סף התראה:{" "}
                  <span dir="ltr">
                    {Math.round((budget.alertThreshold ?? 0.8) * 100)}%
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        {budgetList.filter((b) => b.isActive).length === 0 && (
          <p className="col-span-3 text-center py-8 text-muted-foreground">
            אין קטגוריות תקציב. לחץ על &ldquo;קטגוריה חדשה&rdquo; להוספה.
          </p>
        )}
      </div>
    </div>
  );
}
