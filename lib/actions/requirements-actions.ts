"use server";

import { db } from "@/db/client";
import { requirements, requirementAssignees } from "@/db/schema";
import { requireUser, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";

export async function createRequirementAction(formData: FormData) {
  const user = await requireRole("ADMIN", "MANAGER");

  const title = String(formData.get("title") || "").trim();
  const clientId = String(formData.get("clientId") || "");
  if (!title || !clientId) return;

  const rateMin = formData.get("rateMin") ? Number(formData.get("rateMin")) : null;
  const rateMax = formData.get("rateMax") ? Number(formData.get("rateMax")) : null;
  const dueDateStr = String(formData.get("dueDate") || "");

  const [req] = await db
    .insert(requirements)
    .values({
      title,
      description: String(formData.get("description") || ""),
      skills: String(formData.get("skills") || ""),
      location: String(formData.get("location") || ""),
      employmentType: (formData.get("employmentType") as any) || "W2",
      rateMin,
      rateMax,
      positions: Number(formData.get("positions") || 1),
      priority: (formData.get("priority") as any) || "MEDIUM",
      status: "OPEN",
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      clientId,
      postedById: user.id,
    })
    .returning();

  revalidatePath("/requirements");
  redirect(`/requirements/${req.id}`);
}

export async function updateRequirementStatusAction(requirementId: string, status: string) {
  await requireRole("ADMIN", "MANAGER");
  await db
    .update(requirements)
    .set({ status: status as any })
    .where(eq(requirements.id, requirementId));
  revalidatePath(`/requirements/${requirementId}`);
  revalidatePath("/requirements");
}

export async function assignRecruiterAction(requirementId: string, formData: FormData) {
  await requireRole("ADMIN", "MANAGER");
  const userId = String(formData.get("userId") || "");
  if (!userId) return;
  await db
    .insert(requirementAssignees)
    .values({ requirementId, userId })
    .onConflictDoNothing();
  revalidatePath(`/requirements/${requirementId}`);
}

export async function unassignRecruiterAction(requirementId: string, userId: string) {
  await requireRole("ADMIN", "MANAGER");
  await db
    .delete(requirementAssignees)
    .where(and(eq(requirementAssignees.requirementId, requirementId), eq(requirementAssignees.userId, userId)));
  revalidatePath(`/requirements/${requirementId}`);
}
