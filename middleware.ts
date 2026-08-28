import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secretString = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";
const SECRET = new TextEncoder().encode(secretString);
const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/seed"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p) || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const token = req.cookies.get("ats_session")?.value;
  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, SECRET);
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (!valid) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
