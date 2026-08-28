"use server";

import { db } from "@/db/client";
import { submissions, submissionStatusHistory } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

export async function createSubmissionAction(formData: FormData) {
  const user = await requireUser();

  const candidateId = String(formData.get("candidateId") || "");
  const requirementId = String(formData.get("requirementId") || "");
  if (!candidateId || !requirementId) return;

  const [submission] = await db
    .insert(submissions)
    .values({
      candidateId,
      requirementId,
      submittedById: user.id,
      submittedRate: formData.get("submittedRate") ? Number(formData.get("submittedRate")) : null,
      status: "SUBMITTED",
    })
    .returning();

  await db.insert(submissionStatusHistory).values({
    submissionId: submission.id,
    fromStatus: null,
    toStatus: "SUBMITTED",
    changedById: user.id,
  });

  revalidatePath("/submissions");
  redirect(`/submissions/${submission.id}`);
}

export async function updateSubmissionStatusAction(submissionId: string, toStatus: string, path: string) {
  const user = await requireUser();

  const [current] = await db.select().from(submissions).where(eq(submissions.id, submissionId)).limit(1);
  if (!current) return;

  await db.update(submissions).set({ status: toStatus as any }).where(eq(submissions.id, submissionId));

  await db.insert(submissionStatusHistory).values({
    submissionId,
    fromStatus: current.status,
    toStatus: toStatus as any,
    changedById: user.id,
  });

  revalidatePath(path);
  revalidatePath("/submissions");
}
