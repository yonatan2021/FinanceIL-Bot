"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Download, Search } from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string | Date;
  category: string | null;
  currency: string;
  status: string | null;
}

const MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

export function TransactionsClient() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [search, setSearch] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fmt = new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month, year, limit: "200" });
    const res = await fetch(`/api/transactions?${params}`);
    const json = await res.json();
    setLoading(false);
    if (json.success) {
      setTransactions(json.data as Transaction[]);
      setTotal(json.meta?.total ?? 0);
    }
  }, [month, year]);

  useEffect(() => { load(); }, [load]);

  const filtered = search.trim()
    ? transactions.filter((t) =>
        t.description.toLowerCase().includes(search.toLowerCase())
      )
    : transactions;

  function exportCsv() {
    const header = "תאריך,תיאור,סכום,מטבע,קטגוריה,סטטוס";
    const rows = filtered.map((t) =>
      [
        new Date(t.date).toLocaleDateString("he-IL"),
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount,
        t.currency,
        t.category ?? "",
        t.status ?? "",
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `עסקאות-${year}-${month.padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <div className="relative w-64">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="חיפוש חופשי..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={exportCsv} className="gap-2">
          <Download className="h-4 w-4" />
          ייצוא CSV
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {loading ? "טוען..." : `${total} עסקאות`}
      </p>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">תאריך</TableHead>
              <TableHead className="text-start">תיאור</TableHead>
              <TableHead className="text-start">קטגוריה</TableHead>
              <TableHead className="text-end">סכום</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(tx.date).toLocaleDateString("he-IL")}
                </TableCell>
                <TableCell className="font-medium max-w-xs truncate">
                  {tx.description}
                </TableCell>
                <TableCell className="text-sm">
                  {tx.category ?? <span className="text-muted-foreground">ללא</span>}
                </TableCell>
                <TableCell
                  className={`text-end font-bold ${tx.amount >= 0 ? "text-green-700" : "text-red-600"}`}
                  dir="ltr"
                >
                  {fmt.format(tx.amount)}
                </TableCell>
              </TableRow>
            ))}
            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  אין עסקאות להציג
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
