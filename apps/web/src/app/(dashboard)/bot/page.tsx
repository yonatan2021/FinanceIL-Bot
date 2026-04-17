"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";

interface BotStatus {
  ok: boolean;
  botName?: string;
  username?: string;
  error?: string;
}

interface UserRow {
  id: string;
  name: string | null;
  telegramId: string;
  role: string;
  isActive: boolean | null;
  lastSeenAt: string | null;
}

export default function BotPage() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState<"all" | "admins">("all");
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [directMsg, setDirectMsg] = useState("");
  const [scrapeResult, setScrapeResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/bot/status");
      setStatus((await res.json()) as BotStatus);
    } catch {
      setStatus({ ok: false, error: "שגיאת רשת" });
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const data = (await res.json()) as { data?: UserRow[] };
      setUsers(data.data ?? []);
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
    void fetchUsers();
    const interval = setInterval(() => void fetchStatus(), 30_000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchUsers]);

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bot/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: broadcastMsg, target: broadcastTarget }),
      });
      const data = (await res.json()) as { success: boolean; sent?: number; failed?: number; error?: string };
      setBroadcastResult(
        data.success
          ? `נשלח ל-${data.sent ?? 0} משתמשים (${data.failed ?? 0} נכשלו)`
          : (data.error ?? "שגיאה לא ידועה")
      );
      setBroadcastMsg("");
    } catch {
      setBroadcastResult("שגיאת רשת");
    }
    setLoading(false);
  };

  const handleDirectSend = async () => {
    if (!selectedUser || !directMsg.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bot/notify/${selectedUser.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: directMsg }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      setDirectMsg("");
      setSelectedUser(null);
      setDialogOpen(false);
      alert(data.ok ? "הודעה נשלחה" : `שגיאה: ${data.error ?? "לא ידוע"}`);
    } catch {
      alert("שגיאת רשת");
    }
    setLoading(false);
  };

  const handleScrape = async () => {
    setLoading(true);
    setScrapeResult("מריץ...");
    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      const data = (await res.json()) as { success: boolean; error?: string };
      setScrapeResult(data.success ? "הסקרייפר הסתיים בהצלחה" : `שגיאה: ${data.error ?? "לא ידוע"}`);
    } catch {
      setScrapeResult("שגיאת רשת");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">ניהול בוט</h1>

      {/* Bot Status */}
      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="font-semibold text-lg">סטטוס בוט</h2>
        {status == null ? (
          <span className="text-muted-foreground text-sm">בודק...</span>
        ) : status.ok ? (
          <div className="flex items-center gap-2">
            <Badge variant="default">Online</Badge>
            <span className="text-sm">
              {status.botName} (@{status.username})
            </span>
          </div>
        ) : (
          <Badge variant="destructive">Offline — {status.error}</Badge>
        )}
      </section>

      {/* Users Table */}
      <section className="rounded-lg border p-4 space-y-2">
        <h2 className="font-semibold text-lg">משתמשים</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם</TableHead>
              <TableHead>Telegram ID</TableHead>
              <TableHead>תפקיד</TableHead>
              <TableHead>פעיל</TableHead>
              <TableHead>נראה לאחרונה</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name ?? "—"}</TableCell>
                <TableCell dir="ltr">{u.telegramId}</TableCell>
                <TableCell>{u.role === "admin" ? "מנהל" : "צופה"}</TableCell>
                <TableCell>{u.isActive ? "פעיל" : "לא פעיל"}</TableCell>
                <TableCell>
                  {u.lastSeenAt
                    ? new Date(u.lastSeenAt).toLocaleDateString("he-IL")
                    : "—"}
                </TableCell>
                <TableCell>
                  <Dialog
                    open={dialogOpen && selectedUser?.id === u.id}
                    onOpenChange={(open) => {
                      if (!open) {
                        setDialogOpen(false);
                        setSelectedUser(null);
                        setDirectMsg("");
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(u);
                          setDialogOpen(true);
                        }}
                      >
                        שלח הודעה
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          שליחה ישירה ל-{u.name ?? u.telegramId}
                        </DialogTitle>
                      </DialogHeader>
                      <textarea
                        value={directMsg}
                        onChange={(e) => setDirectMsg(e.target.value)}
                        placeholder="הקלד הודעה..."
                        rows={4}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <Button
                        onClick={() => void handleDirectSend()}
                        disabled={!directMsg.trim() || loading}
                      >
                        שלח
                      </Button>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  אין משתמשים
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      {/* Broadcast */}
      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold text-lg">שליחת הודעה לכולם</h2>
        <div className="space-y-1">
          <Label htmlFor="broadcast-target">קהל יעד</Label>
          <select
            id="broadcast-target"
            value={broadcastTarget}
            onChange={(e) => setBroadcastTarget(e.target.value as "all" | "admins")}
            className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">כל המשתמשים הפעילים</option>
            <option value="admins">מנהלים בלבד</option>
          </select>
        </div>
        <textarea
          value={broadcastMsg}
          onChange={(e) => setBroadcastMsg(e.target.value)}
          placeholder="הודעה לשליחה..."
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button
          onClick={() => void handleBroadcast()}
          disabled={!broadcastMsg.trim() || loading}
        >
          שלח הודעה
        </Button>
        {broadcastResult != null && (
          <p className="text-sm text-muted-foreground">{broadcastResult}</p>
        )}
      </section>

      {/* Manual Scrape */}
      <section className="rounded-lg border p-4 space-y-3">
        <h2 className="font-semibold text-lg">הפעלת סקרייפר ידנית</h2>
        <Button
          onClick={() => void handleScrape()}
          disabled={loading}
          variant="outline"
        >
          הרץ סקרייפר עכשיו
        </Button>
        {scrapeResult != null && <p className="text-sm">{scrapeResult}</p>}
      </section>
    </div>
  );
}
