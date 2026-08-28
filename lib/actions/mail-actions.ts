"use server";

import { db } from "@/db/client";
import { candidates, mailSettings, emailCampaigns, emailCampaignRecipients } from "@/db/schema";
import { requireRole, requireUser } from "@/lib/auth";
import { eq, inArray } from "drizzle-orm";
import { loadMailConfig } from "@/lib/email/ses";
import { getMassEmailQueue } from "@/lib/queue/mail-queue";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveSesSettingsAction(formData: FormData) {
  await requireRole("ADMIN");

  const values = {
    region: String(formData.get("region") || ""),
    accessKeyId: String(formData.get("accessKeyId") || ""),
    secretAccessKey: String(formData.get("secretAccessKey") || ""),
    fromEmail: String(formData.get("fromEmail") || ""),
    fromName: String(formData.get("fromName") || "") || null,
    enabled: formData.get("enabled") === "on",
  };

  const [existing] = await db.select().from(mailSettings).where(eq(mailSettings.provider, "SES")).limit(1);
  if (existing) {
    await db.update(mailSettings).set(values).where(eq(mailSettings.provider, "SES"));
  } else {
    await db.insert(mailSettings).values({ provider: "SES", ...values });
  }

  revalidatePath("/admin/integrations");
}

/**
 * Queues a mass-email campaign instead of sending synchronously. This
 * handler's only job is: validate, write the campaign + per-recipient rows,
 * push one job per recipient onto the mass-email queue, and return — the
 * actual sending happens in workers/email-worker.ts, throttled, in the
 * background. See lib/queue/mail-queue.ts for why.
 */
export async function sendMassEmailAction(formData: FormData) {
  const user = await requireUser();

  const candidateIds = formData.getAll("candidateIds").map(String);
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (candidateIds.length === 0 || !subject || !body) return;

  const config = await loadMailConfig();
  if (!config) {
    redirect("/mail?error=not_configured");
  }

  const recipients = await db
    .select({ id: candidates.id, email: candidates.email, name: candidates.firstName })
    .from(candidates)
    .where(inArray(candidates.id, candidateIds));

  const withEmail = recipients.filter((r): r is { id: string; email: string; name: string } => !!r.email);
  if (withEmail.length === 0) {
    redirect("/mail?error=no_recipients");
  }

  const [campaign] = await db
    .insert(emailCampaigns)
    .values({ subject, body, recipientCount: withEmail.length, status: "QUEUED", sentById: user.id })
    .returning();

  const recipientRows = await db
    .insert(emailCampaignRecipients)
    .values(
      withEmail.map((r) => ({
        campaignId: campaign.id,
        candidateId: r.id,
        email: r.email,
        name: r.name,
        status: "PENDING" as const,
      }))
    )
    .returning();

  const queue = getMassEmailQueue();
  await queue.addBulk(
    recipientRows.map((row) => ({
      name: "send-email",
      data: {
        campaignId: campaign.id,
        recipientId: row.id,
        email: row.email,
        name: row.name || undefined,
        subject,
        body,
      },
    }))
  );

  revalidatePath("/mail");
  redirect("/mail?queued=1");
}
