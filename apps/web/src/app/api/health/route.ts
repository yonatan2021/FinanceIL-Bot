import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { db } = await import("@finance-bot/db");
    const { sql } = await import("drizzle-orm");
    db.run(sql`SELECT 1`);
  } catch (err) {
    console.error("[health] DB check failed:", err);
    return NextResponse.json(
      { status: "error", reason: "db_unavailable" },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? "unknown",
  });
}
