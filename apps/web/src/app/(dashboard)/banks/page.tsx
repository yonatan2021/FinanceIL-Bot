import { TopBar } from "@/components/layout/top-bar";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { credentials } from "@finance-bot/db/schema";
import { ne } from "drizzle-orm";
import { BanksClient } from "./banks-client";

export default async function BanksPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const db = await getDb();
  const rows = await db
    .select({
      id: credentials.id,
      displayName: credentials.displayName,
      bankId: credentials.bankId,
      status: credentials.status,
      lastScrapedAt: credentials.lastScrapedAt,
    })
    .from(credentials)
    .where(ne(credentials.status, "disabled"));

  return (
    <div>
      <TopBar title="בנקים" />
      <div className="p-6">
        <BanksClient initialCredentials={rows} />
      </div>
    </div>
  );
}
