import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/health"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  if (isPublic) return NextResponse.next();

  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg)$).*)"],
};
