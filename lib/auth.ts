import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db/client";
import { users, type Role } from "@/db/schema";
import { eq } from "drizzle-orm";

export const SESSION_COOKIE_NAME = "ats_session";

const secretString = process.env.AUTH_SECRET || "dev-only-insecure-secret-change-me";
const SECRET = new TextEncoder().encode(secretString);

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

/** Server-side helper: read + verify the session cookie for the current request. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;

  // Re-check the user still exists/active on every request — cheap and keeps
  // a deactivated user's stale-but-valid JWT from continuing to work.
  const [dbUser] = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  if (!dbUser || !dbUser.active) return null;

  return { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}
