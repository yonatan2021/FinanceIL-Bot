import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { accounts, transactions, credentials } from "@finance-bot/db/schema";
import { sql, desc } from "drizzle-orm";
import { TopBar } from "@/components/layout/top-bar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateHE } from "@finance-bot/utils/dates";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const db = await getDb();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [allAccounts, recentTxs, monthlySummary] = await Promise.all([
    db
      .select({
        id: accounts.id,
        accountNumber: accounts.accountNumber,
        balance: accounts.balance,
        bankId: credentials.bankId,
        bankName: credentials.displayName,
      })
      .from(accounts)
      .leftJoin(credentials, sql`${accounts.credentialId} = ${credentials.id}`),

    db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.date))
      .limit(5),

    db
      .select({
        type: transactions.type,
        total: sql<number>`sum(${transactions.amount})`,
      })
      .from(transactions)
      .where(
        sql`${transactions.date} >= ${monthStart} AND ${transactions.date} <= ${monthEnd}`
      )
      .groupBy(transactions.type),
  ]);

  const totalBalance = allAccounts.reduce((s, a) => s + a.balance, 0);

  const totalExpenses = monthlySummary
    .filter((r) => Number(r.total) < 0)
    .reduce((s, r) => s + Math.abs(Number(r.total)), 0);

  const totalIncome = monthlySummary
    .filter((r) => Number(r.total) > 0)
    .reduce((s, r) => s + Number(r.total), 0);

  const fmt = new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 2,
  });

  return (
    <div>
      <TopBar title="לוח בקרה" />
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                יתרה כוללת
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-900">
                <span dir="ltr">{fmt.format(totalBalance)}</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                סה&quot;כ הוצאות החודש
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                <span dir="ltr">{fmt.format(totalExpenses)}</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                סה&quot;כ הכנסות החודש
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                <span dir="ltr">{fmt.format(totalIncome)}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>חשבונות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {account.bankName ?? account.bankId}
                    </p>
                    <p className="text-sm text-muted-foreground" dir="ltr">
                      {account.accountNumber}
                    </p>
                  </div>
                  <span
                    className={`font-bold text-lg ${account.balance >= 0 ? "text-green-700" : "text-red-600"}`}
                    dir="ltr"
                  >
                    {fmt.format(account.balance)}
                  </span>
                </div>
              ))}
              {allAccounts.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  אין חשבונות מחוברים
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>5 עסקאות אחרונות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTxs.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-900 truncate max-w-xs">
                      {tx.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateHE(tx.date)}
                      {tx.category && ` · ${tx.category}`}
                    </p>
                  </div>
                  <span
                    className={`font-bold ${tx.amount >= 0 ? "text-green-700" : "text-red-600"}`}
                    dir="ltr"
                  >
                    {fmt.format(tx.amount)}
                  </span>
                </div>
              ))}
              {recentTxs.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  אין עסקאות
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
