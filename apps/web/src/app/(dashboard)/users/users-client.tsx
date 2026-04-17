"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface AllowedUser {
  id: string;
  telegramId: string;
  name: string | null;
  role: string;
  isActive: boolean | null;
  createdAt: Date | null;
}

interface Props {
  initialUsers: AllowedUser[];
}

export function UsersClient({ initialUsers }: Props) {
  const [users, setUsers] = useState<AllowedUser[]>(initialUsers);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ telegramId: "", name: "", role: "viewer" });
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegram_chat_id: form.telegramId,
        name: form.name || undefined,
        role: form.role,
      }),
    });

    const json = await res.json();
    if (!json.success) {
      setError(json.error ?? "שגיאה בהוספת משתמש");
      return;
    }

    setUsers((prev) => [...prev, json.data]);
    setDialogOpen(false);
    setForm({ telegramId: "", name: "", role: "viewer" });
  }

  async function toggleActive(id: string, current: boolean | null) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !current }),
    });
    const json = await res.json();
    if (json.success) {
      setUsers((prev) => prev.map((u) => (u.id === id ? json.data : u)));
    }
  }

  async function changeRole(id: string, role: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const json = await res.json();
    if (json.success) {
      setUsers((prev) => prev.map((u) => (u.id === id ? json.data : u)));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              הוסף משתמש
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>הוספת משתמש טלגרם</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="tg-id">מזהה טלגרם (Chat ID)</Label>
                <Input
                  id="tg-id"
                  dir="ltr"
                  value={form.telegramId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, telegramId: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tg-name">שם (אופציונלי)</Label>
                <Input
                  id="tg-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>תפקיד</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">צופה</SelectItem>
                    <SelectItem value="admin">מנהל</SelectItem>
                  </SelectContent>
                </Select>
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

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">שם</TableHead>
              <TableHead className="text-start">Chat ID</TableHead>
              <TableHead className="text-start">תפקיד</TableHead>
              <TableHead className="text-start">סטטוס</TableHead>
              <TableHead className="text-start">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.name ?? <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell dir="ltr" className="font-mono text-sm">
                  {user.telegramId}
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    onValueChange={(v) => changeRole(user.id, v)}
                  >
                    <SelectTrigger className="w-28 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">צופה</SelectItem>
                      <SelectItem value="admin">מנהל</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      user.isActive
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-slate-100 text-slate-600"
                    }
                  >
                    {user.isActive ? "פעיל" : "מושבת"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(user.id, user.isActive)}
                  >
                    {user.isActive ? "השבת" : "הפעל"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  אין משתמשים. לחץ על &ldquo;הוסף משתמש&rdquo; להוספה.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
