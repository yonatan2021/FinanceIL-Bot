import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REDIRECTS: Record<string, string> = {
  "/users": "/bot/users",
  "/logs": "/bot/logs",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const destination = REDIRECTS[pathname];
  if (destination) {
    return NextResponse.redirect(new URL(destination, request.url), 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/users", "/logs"],
};
