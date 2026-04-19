import { TopBar } from "@/components/layout/top-bar";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { scrapeLogs, credentials } from "@finance-bot/db/schema";
import { sql, eq } from "drizzle-orm";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function BotLogsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const db = await getDb();
  const rows = await db
    .select({
      id: scrapeLogs.id,
      startedAt: scrapeLogs.startedAt,
      finishedAt: scrapeLogs.finishedAt,
      transactionsFetched: scrapeLogs.transactionsFetched,
      status: scrapeLogs.status,
      errorMessage: scrapeLogs.errorMessage,
      bankName: credentials.displayName,
    })
    .from(scrapeLogs)
    .leftJoin(credentials, eq(scrapeLogs.credentialId, credentials.id))
    .orderBy(sql`${scrapeLogs.startedAt} DESC`)
    .limit(30);

  function duration(start: Date, end: Date | null) {
    if (!end) return "—";
    const ms = end.getTime() - start.getTime();
    const secs = Math.round(ms / 1000);
    return `${secs}ש׳`;
  }

  return (
    <div>
      <TopBar title="לוגי סקרייפינג" />
      <div className="p-6">
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-start">בנק</TableHead>
                <TableHead className="text-start">התחיל</TableHead>
                <TableHead className="text-start">משך</TableHead>
                <TableHead className="text-start">עסקאות</TableHead>
                <TableHead className="text-start">סטטוס</TableHead>
                <TableHead className="text-start">שגיאה</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    {row.bankName ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(row.startedAt).toLocaleString("he-IL")}
                  </TableCell>
                  <TableCell className="text-sm" dir="ltr">
                    {duration(row.startedAt, row.finishedAt)}
                  </TableCell>
                  <TableCell dir="ltr">
                    {row.transactionsFetched ?? 0}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-sm text-destructive max-w-xs truncate">
                    {row.errorMessage ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    אין ריצות
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
