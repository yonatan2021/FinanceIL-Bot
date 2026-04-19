export const dynamic = "force-dynamic";

import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { accounts, transactions, credentials } from "@finance-bot/db/schema";
import { sql, desc } from "drizzle-orm";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/features/dashboard/kpi-card";
import { formatDateHE } from "@finance-bot/utils/dates";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const db = await getDb();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const monthStartTs = Math.floor(monthStart.getTime() / 1000);
  const monthEndTs = Math.floor(monthEnd.getTime() / 1000);

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
      .select({
        id: transactions.id,
        date: transactions.date,
        description: transactions.description,
        amount: transactions.amount,
        category: transactions.category,
      })
      .from(transactions)
      .orderBy(desc(transactions.date))
      .limit(8),

    db
      .select({
        total: sql<number>`sum(${transactions.amount})`,
        isExpense: sql<number>`cast(${transactions.amount} < 0 as integer)`,
      })
      .from(transactions)
      .where(
        sql`${transactions.date} >= ${monthStartTs} AND ${transactions.date} <= ${monthEndTs}`
      )
      .groupBy(sql`cast(${transactions.amount} < 0 as integer)`),
  ]);

  const totalBalance = allAccounts.reduce((s, a) => s + a.balance, 0);

  const totalExpenses = monthlySummary
    .filter((r) => r.isExpense === 1)
    .reduce((s, r) => s + Math.abs(Number(r.total)), 0);

  const totalIncome = monthlySummary
    .filter((r) => r.isExpense === 0)
    .reduce((s, r) => s + Number(r.total), 0);

  const netSavings = totalIncome - totalExpenses;

  const fmt = new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div>
      <TopBar title="לוח בקרה" />

      <div className="p-6 space-y-6">

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="יתרה כוללת"
            formattedValue={fmt.format(totalBalance)}
            icon={Wallet}
            variant="balance"
            subtitle={`${allAccounts.length} חשבונות`}
          />
          <KpiCard
            title="הכנסות החודש"
            formattedValue={fmt.format(totalIncome)}
            icon={TrendingUp}
            variant="income"
          />
          <KpiCard
            title="הוצאות החודש"
            formattedValue={fmt.format(totalExpenses)}
            icon={TrendingDown}
            variant="expense"
          />
          <KpiCard
            title="חיסכון נטו"
            formattedValue={fmt.format(Math.abs(netSavings))}
            icon={ArrowLeftRight}
            variant={netSavings >= 0 ? "net-positive" : "net-negative"}
            subtitle={netSavings < 0 ? "גירעון החודש" : "עודף החודש"}
          />
        </div>

        {/* 2-column: Accounts (1/3) + Recent Transactions (2/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Accounts */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-800">
                  חשבונות בנק
                </CardTitle>
                <Landmark className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              {allAccounts.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <p className="text-sm text-slate-500">אין חשבונות מחוברים</p>
                  <a
                    href="/banks"
                    className="text-xs text-primary hover:underline underline-offset-2"
                  >
                    חבר בנק ראשון
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {allAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {account.bankName ?? account.bankId}
                        </p>
                        <p className="text-xs text-slate-400 font-mono" dir="ltr">
                          ****{account.accountNumber?.slice(-4) ?? ""}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-bold tabular-nums shrink-0 ms-2",
                          account.balance >= 0 ? "text-emerald-700" : "text-red-600"
                        )}
                        dir="ltr"
                      >
                        {fmt.format(account.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="lg:col-span-2 border border-slate-200 shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-800">
                  עסקאות אחרונות
                </CardTitle>
                <a
                  href="/transactions"
                  className="text-xs text-primary hover:underline underline-offset-2"
                >
                  הצג הכל
                </a>
              </div>
            </CardHeader>
            <CardContent className="pt-3">
              {recentTxs.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-500">אין עסקאות</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentTxs.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-3 gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">
                            {formatDateHE(tx.date)}
                          </span>
                          {tx.category && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-1.5 py-0 h-4 font-normal"
                            >
                              {tx.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-bold tabular-nums shrink-0",
                          tx.amount >= 0 ? "text-emerald-700" : "text-red-600"
                        )}
                        dir="ltr"
                      >
                        {fmt.format(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
