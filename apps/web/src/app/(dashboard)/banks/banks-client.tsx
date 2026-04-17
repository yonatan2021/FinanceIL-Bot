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
import { StatusBadge } from "@/components/shared/status-badge";
import { Plus, Trash2 } from "lucide-react";

interface SafeCredential {
  id: string;
  displayName: string;
  bankId: string;
  status: string | null;
  lastScrapedAt: Date | null;
}

interface Props {
  initialCredentials: SafeCredential[];
}

export function BanksClient({ initialCredentials }: Props) {
  const [creds, setCreds] = useState<SafeCredential[]>(initialCredentials);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    bankId: "",
    username: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: form.displayName,
        bankId: form.bankId,
        loginData: { username: form.username, password: form.password },
      }),
    });

    const json = await res.json();

    if (!json.success) {
      setError(json.error ?? "שגיאה בהוספת הבנק");
      return;
    }

    setCreds((prev) => [...prev, json.data]);
    setDialogOpen(false);
    setForm({ displayName: "", bankId: "", username: "", password: "" });
  }

  async function handleDelete(id: string) {
    if (!confirm("להסיר בנק זה?")) return;
    const res = await fetch(`/api/credentials/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      setCreds((prev) => prev.filter((c) => c.id !== id));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              הוסף בנק
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>הוספת חשבון בנק</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="bank-name">שם תצוגה</Label>
                <Input
                  id="bank-name"
                  value={form.displayName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, displayName: e.target.value }))
                  }
                  placeholder="לדוגמה: לאומי עו&quot;ש"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank-id">מזהה בנק (bankId)</Label>
                <Input
                  id="bank-id"
                  dir="ltr"
                  value={form.bankId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, bankId: e.target.value }))
                  }
                  placeholder="hapoalim / leumi / ..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank-user">שם משתמש</Label>
                <Input
                  id="bank-user"
                  dir="ltr"
                  value={form.username}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, username: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank-pass">סיסמה / קוד</Label>
                <Input
                  id="bank-pass"
                  type="password"
                  dir="ltr"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  required
                />
              </div>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  ביטול
                </Button>
                <Button type="submit">הוספה</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {creds.map((cred) => (
          <Card key={cred.id}>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">{cred.displayName}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(cred.id)}
                aria-label="הסרה"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground" dir="ltr">
                {cred.bankId}
              </p>
              <div className="flex items-center justify-between">
                <StatusBadge status={cred.status ?? "active"} />
                {cred.lastScrapedAt && (
                  <span className="text-xs text-muted-foreground">
                    עודכן:{" "}
                    {new Date(cred.lastScrapedAt).toLocaleDateString("he-IL")}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {creds.length === 0 && (
          <p className="col-span-3 text-center py-8 text-muted-foreground">
            אין בנקים מחוברים. לחץ על &ldquo;הוסף בנק&rdquo; להוספה.
          </p>
        )}
      </div>
    </div>
  );
}
