export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { BANKS } from "@/lib/banks";
import { z } from "zod";

const BodySchema = z.object({
  bankId: z.string().min(1),
  loginData: z.record(z.string(), z.string()),
});

// TODO: wire to actual israeli-bank-scrapers dry run

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// Simple in-memory rate limiter: 3 calls per userId per hour
const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  rateLimitMap.set(userId, { count: entry.count + 1, windowStart: entry.windowStart });
  return true;
}


export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }

  const userId = session.user.id;

  if (!checkRateLimit(userId)) {
    return NextResponse.json(
      { success: false, error: "יותר מדי ניסיונות. נסה שוב עוד שעה.", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: {
          "Retry-After": "3600",
          // NOTE: in-memory rate limiter resets on server restart — replace with DB/Redis for v1.0.0 multi-user
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "גוף הבקשה אינו תקין", code: "INVALID_BODY" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "נתונים לא תקינים", code: "INVALID_PARAMS" },
      { status: 400 },
    );
  }
  const { bankId, loginData } = parsed.data;

  // Validate bankId is a known bank
  if (!(bankId in BANKS)) {
    return NextResponse.json(
      { success: false, error: "מזהה בנק אינו תקין", code: "INVALID_BANK_ID" },
      { status: 400 }
    );
  }

  // Validate loginData fields match bank definition
  const bank = BANKS[bankId];
  const requiredKeys = new Set(bank.fields.map((f) => f.key));
  const providedKeys = new Set(Object.keys(loginData ?? {}));

  for (const key of requiredKeys) {
    if (!providedKeys.has(key) || !(loginData[key] ?? "").trim()) {
      return NextResponse.json(
        { success: false, error: `שדה חסר: ${key}`, code: "MISSING_FIELD" },
        { status: 400 }
      );
    }
  }

  // Real scraper dry-run not yet wired — do not return fake success
  return NextResponse.json(
    {
      success: false,
      error: "בדיקת חיבור אינה זמינה עדיין. ניתן לדלג ולהמשיך.",
      code: "NOT_IMPLEMENTED",
    },
    { status: 503 },
  );
}
