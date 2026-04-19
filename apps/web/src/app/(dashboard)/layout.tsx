export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/layout/sidebar";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ms-64 min-h-screen">{children}</main>
    </div>
  );
}
