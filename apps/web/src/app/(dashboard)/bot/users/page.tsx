import { TopBar } from "@/components/layout/top-bar";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { allowedUsers } from "@finance-bot/db/schema";
import { UsersClient } from "../../users/users-client";

export default async function BotUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const db = await getDb();
  const rows = await db.select().from(allowedUsers).orderBy(allowedUsers.createdAt);

  return (
    <div>
      <TopBar title="משתמשים מורשים" />
      <div className="p-6 space-y-4">
        <div
          role="note"
          className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
        >
          רק המשתמשים ברשימה יכולים להשתמש בבוט. כל הודעה ממספר שאינו ברשימה נחסמת אוטומטית.
        </div>
        <UsersClient initialUsers={rows} />
      </div>
    </div>
  );
}
