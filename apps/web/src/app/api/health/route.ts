import { NextResponse } from "next/server";
import { db } from "@finance-bot/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
