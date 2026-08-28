"use server";

import { db } from "@/db/client";
import { notes } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type NoteTarget = { requirementId?: string; candidateId?: string; submissionId?: string };

export async function addNoteAction(target: NoteTarget, path: string, formData: FormData) {
  const user = await requireUser();
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  await db.insert(notes).values({
    body,
    authorId: user.id,
    requirementId: target.requirementId,
    candidateId: target.candidateId,
    submissionId: target.submissionId,
  });

  revalidatePath(path);
}
