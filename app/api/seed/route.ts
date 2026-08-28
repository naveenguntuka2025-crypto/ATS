import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import bcrypt from "bcryptjs";
import { createId } from "@paralleldrive/cuid2";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const password = await bcrypt.hash("password123", 10);
    await db.insert(users).values({
      id: createId(),
      name: "Alex Admin",
      email: "admin@demo.com",
      passwordHash: password,
      role: "ADMIN"
    }).onConflictDoNothing();
    
    return NextResponse.json({ success: true, message: "Seeded Admin successfully." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
