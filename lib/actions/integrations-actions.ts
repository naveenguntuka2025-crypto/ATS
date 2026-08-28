"use server";

import { db } from "@/db/client";
import { jobBoardIntegrations, storageIntegrations } from "@/db/schema";
import type { JobBoardProvider, StorageProvider } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getJobBoardAdapter } from "@/lib/integrations/registry";

export async function saveJobBoardCredentialsAction(provider: JobBoardProvider, formData: FormData) {
  await requireRole("ADMIN");

  const apiKey = String(formData.get("apiKey") || "");
  const accountId = String(formData.get("accountId") || "");
  const enabled = formData.get("enabled") === "on";
  const credentials = JSON.stringify({ apiKey, accountId });

  const [existing] = await db.select().from(jobBoardIntegrations).where(eq(jobBoardIntegrations.provider, provider)).limit(1);
  if (existing) {
    await db.update(jobBoardIntegrations).set({ credentials, enabled }).where(eq(jobBoardIntegrations.provider, provider));
  } else {
    await db.insert(jobBoardIntegrations).values({ provider, credentials, enabled });
  }

  revalidatePath("/admin/integrations");
}

export async function testJobBoardConnectionAction(provider: JobBoardProvider) {
  await requireRole("ADMIN");
  const adapter = getJobBoardAdapter(provider);
  const result = await adapter.postRequirement({
    title: "Connection test",
    description: "test",
    location: "test",
    skills: "test",
  });
  return result;
}

export async function saveZohoCredentialsAction(formData: FormData) {
  await requireRole("ADMIN");

  const credentials = JSON.stringify({
    clientId: String(formData.get("clientId") || ""),
    clientSecret: String(formData.get("clientSecret") || ""),
    refreshToken: String(formData.get("refreshToken") || ""),
    rootFolderId: String(formData.get("rootFolderId") || ""),
    accountsBaseUrl: String(formData.get("accountsBaseUrl") || "") || undefined,
    apiBaseUrl: String(formData.get("apiBaseUrl") || "") || undefined,
  });
  const enabled = formData.get("enabled") === "on";

  const [existing] = await db
    .select()
    .from(storageIntegrations)
    .where(eq(storageIntegrations.provider, "ZOHO_WORKDRIVE"))
    .limit(1);

  if (existing) {
    await db.update(storageIntegrations).set({ credentials, enabled }).where(eq(storageIntegrations.provider, "ZOHO_WORKDRIVE"));
  } else {
    await db.insert(storageIntegrations).values({ provider: "ZOHO_WORKDRIVE", credentials, enabled });
  }

  revalidatePath("/admin/integrations");
}
