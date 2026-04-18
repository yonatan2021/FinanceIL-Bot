"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";

interface UserRow {
  id: string;
  name: string | null;
  telegramId: string;
  role: string;
  isActive: boolean | null;
}

export default function BotMessagesPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastTarget, setBroadcastTarget] = useState<"all" | "admins">("all");
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [directMsg, setDirectMsg] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

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
    void fetchUsers();
  }, [fetchUsers]);

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bot/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: broadcastMsg, target: broadcastTarget }),
      });
      const data = (await res.json()) as {
        success: boolean;
        sent?: number;
        failed?: number;
        error?: string;
      };
      if (data.success) {
        toast.success(`נשלח ל-${data.sent ?? 0} משתמשים (${data.failed ?? 0} נכשלו)`);
        setBroadcastMsg("");
      } else {
        toast.error(data.error ?? "שגיאה לא ידועה");
      }
    } catch {
      toast.error("שגיאת רשת");
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
      if (data.ok) {
        toast.success("הודעה נשלחה");
      } else {
        toast.error(`שגיאה: ${data.error ?? "לא ידוע"}`);
      }
      setDirectMsg("");
      setSelectedUser(null);
      setDialogOpen(false);
    } catch {
      toast.error("שגיאת רשת");
    }
    setLoading(false);
  };

  return (
    <div>
      <TopBar title="הודעות ושידור" />
      <div className="p-6 space-y-6">

        {/* Broadcast section */}
        <section className="rounded-lg border bg-white p-5 space-y-4">
          <h2 className="font-semibold text-base">שליחת הודעה לכולם</h2>
          <div className="space-y-1">
            <Label htmlFor="broadcast-target">קהל יעד</Label>
            <select
              id="broadcast-target"
              value={broadcastTarget}
              onChange={(e) => setBroadcastTarget(e.target.value as "all" | "admins")}
              className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <option value="all">כל המשתמשים הפעילים</option>
              <option value="admins">מנהלים בלבד</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="broadcast-message">הודעה</Label>
            <textarea
              id="broadcast-message"
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              placeholder="הודעה לשליחה..."
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            />
          </div>
          <Button
            onClick={() => void handleBroadcast()}
            disabled={!broadcastMsg.trim() || loading}
            className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            שלח הודעה
          </Button>
        </section>

        {/* Direct message section */}
        <section className="rounded-lg border bg-white p-5 space-y-4">
          <h2 className="font-semibold text-base">שליחת הודעה ישירה</h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">שם</TableHead>
                  <TableHead className="text-start">Telegram ID</TableHead>
                  <TableHead className="text-start">תפקיד</TableHead>
                  <TableHead className="text-start">פעולה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name ?? "—"}</TableCell>
                    <TableCell dir="ltr" className="font-mono text-sm">
                      {u.telegramId}
                    </TableCell>
                    <TableCell>{u.role === "admin" ? "מנהל" : "צופה"}</TableCell>
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
                            className="focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
                          <div className="space-y-3 pt-2">
                            <textarea
                              value={directMsg}
                              onChange={(e) => setDirectMsg(e.target.value)}
                              placeholder="הקלד הודעה..."
                              rows={4}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            />
                            <Button
                              onClick={() => void handleDirectSend()}
                              disabled={!directMsg.trim() || loading}
                              className="w-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            >
                              שלח
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      אין משתמשים
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>

      </div>
    </div>
  );
}
