"use server";

import { db } from "@/db/client";
import { candidates } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCandidateAction(formData: FormData) {
  const user = await requireUser();

  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  if (!firstName || !lastName) return;

  const [candidate] = await db
    .insert(candidates)
    .values({
      firstName,
      lastName,
      email: String(formData.get("email") || "") || null,
      phone: String(formData.get("phone") || "") || null,
      currentTitle: String(formData.get("currentTitle") || "") || null,
      skills: String(formData.get("skills") || ""),
      experienceYears: formData.get("experienceYears") ? Number(formData.get("experienceYears")) : null,
      location: String(formData.get("location") || "") || null,
      workAuthorization: String(formData.get("workAuthorization") || "") || null,
      source: (formData.get("source") as any) || "INTERNAL",
      ownerId: user.id,
    })
    .returning();

  revalidatePath("/candidates");
  redirect(`/candidates/${candidate.id}`);
}
