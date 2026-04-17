export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";

export async function GET(): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "BOT_TOKEN not configured" });
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = (await res.json()) as {
      ok: boolean;
      description?: string;
      result?: { first_name: string; username: string };
    };
    if (!data.ok) {
      return NextResponse.json({ ok: false, error: data.description ?? "Unknown error" });
    }
    return NextResponse.json({
      ok: true,
      botName: data.result!.first_name,
      username: data.result!.username,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ ok: false, error: message });
  }
}
