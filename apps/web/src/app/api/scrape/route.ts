export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";

export async function POST(request: Request): Promise<NextResponse> {
  const internalSecret = (request as Request & { headers: Headers }).headers.get(
    "x-internal-secret"
  );
  const configuredSecret = process.env.INTERNAL_API_SECRET;
  const isInternalCall =
    configuredSecret != null && internalSecret === configuredSecret;

  if (!isInternalCall) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const scraperUrl = process.env.SCRAPER_URL ?? "http://scraper:3001/scrape";
  try {
    const res = await fetch(scraperUrl, { method: "POST" });
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Scraper returned ${res.status}` },
        { status: 502 }
      );
    }
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 503 });
  }
}
