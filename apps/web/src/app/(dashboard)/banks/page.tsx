import { TopBar } from "@/components/layout/top-bar";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BanksClient } from "./banks-client";

export default async function BanksPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div>
      <TopBar title="בנקים" />
      <div className="p-6">
        <BanksClient />
      </div>
    </div>
  );
}
