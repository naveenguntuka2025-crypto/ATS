"use server";

import { db } from "@/db/client";
import { clients } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createClientAction(formData: FormData) {
  const user = await requireUser();

  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const [client] = await db
    .insert(clients)
    .values({
      name,
      contactName: String(formData.get("contactName") || "") || null,
      contactEmail: String(formData.get("contactEmail") || "") || null,
      contactPhone: String(formData.get("contactPhone") || "") || null,
      notes: String(formData.get("notes") || "") || null,
      ownerId: user.id,
    })
    .returning();

  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}
