import { TopBar } from "@/components/layout/top-bar";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { budgets } from "@finance-bot/db/schema";
import { BudgetsClient } from "./budgets-client";

export default async function BudgetsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const db = await getDb();
  const rows = await db.select().from(budgets).orderBy(budgets.createdAt);

  return (
    <div>
      <TopBar title="תקציבים" />
      <div className="p-6">
        <BudgetsClient initialBudgets={rows} />
      </div>
    </div>
  );
}
