"use server";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, signSession, SESSION_COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const from = String(formData.get("from") || "/");

  if (!email || !password) {
    redirect(`/login?error=missing&from=${encodeURIComponent(from)}`);
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || !user.active) {
    redirect(`/login?error=invalid&from=${encodeURIComponent(from)}`);
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    redirect(`/login?error=invalid&from=${encodeURIComponent(from)}`);
  }

  const token = await signSession({ id: user.id, name: user.name, email: user.email, role: user.role });
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(from && from !== "/login" ? from : "/");
}

export async function logoutAction() {
  cookies().delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

// Admin-only: create a new user account.
export async function createUserAction(formData: FormData) {
  const { requireRole } = await import("@/lib/auth");
  await requireRole("ADMIN");

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "RECRUITER") as "ADMIN" | "MANAGER" | "RECRUITER";

  if (!name || !email || !password) return;

  const passwordHash = await hashPassword(password);
  await db.insert(users).values({ name, email, passwordHash, role });

  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/users");
}

export async function toggleUserActiveAction(userId: string, active: boolean) {
  const { requireRole } = await import("@/lib/auth");
  await requireRole("ADMIN");
  await db.update(users).set({ active }).where(eq(users.id, userId));
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/admin/users");
}
