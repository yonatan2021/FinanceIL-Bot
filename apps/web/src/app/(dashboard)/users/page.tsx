import { TopBar } from "@/components/layout/top-bar";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { allowedUsers } from "@finance-bot/db/schema";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const db = await getDb();
  const rows = await db.select().from(allowedUsers).orderBy(allowedUsers.createdAt);

  return (
    <div>
      <TopBar title="משתמשי טלגרם" />
      <div className="p-6">
        <UsersClient initialUsers={rows} />
      </div>
    </div>
  );
}
