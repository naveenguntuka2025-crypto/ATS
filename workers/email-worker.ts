// Background worker for the mass-email queue. Run this as its OWN process,
// separate from the Next.js app:
//
//   npm run worker:email
//
// In production, deploy it as its own service/dyno/container — it does not
// need to run on the same machine as the web app, only share the same
// REDIS_URL and DATABASE_URL. Scale it by running more worker instances or
// raising `concurrency` below; the rate limiter still caps total throughput
// regardless of how many workers are running.

import { Worker, Job } from "bullmq";
import { createRedisConnection } from "../lib/queue/redis";
import { MASS_EMAIL_QUEUE_NAME, MASS_EMAIL_RATE_LIMIT, type MassEmailJobData } from "../lib/queue/mail-queue";
import { db } from "../db/client";
import { emailCampaignRecipients, emailCampaigns } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { loadMailConfig, sendMassEmail } from "../lib/email/ses";

const DEFAULT_MAX_ATTEMPTS = 3;

/** True once every recipient row for this campaign has left PENDING — sets the campaign's final status. */
async function finalizeIfComplete(campaignId: string) {
  const [remaining] = await db
    .select({ count: sql<number>`count(*)` })
    .from(emailCampaignRecipients)
    .where(and(eq(emailCampaignRecipients.campaignId, campaignId), eq(emailCampaignRecipients.status, "PENDING")));

  if (remaining.count > 0) return;

  const [campaign] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, campaignId)).limit(1);
  if (!campaign) return;

  const finalStatus = campaign.failureCount === 0 ? "SENT" : campaign.successCount === 0 ? "FAILED" : "PARTIAL";
  await db.update(emailCampaigns).set({ status: finalStatus }).where(eq(emailCampaigns.id, campaignId));
}

async function processJob(job: Job<MassEmailJobData>) {
  const { campaignId, recipientId, email, name, subject, body } = job.data;
  const maxAttempts = job.opts.attempts ?? DEFAULT_MAX_ATTEMPTS;
  const isLastAttempt = job.attemptsMade + 1 >= maxAttempts;

  // Mark the campaign PROCESSING on its first job (idempotent no-op after that).
  await db
    .update(emailCampaigns)
    .set({ status: "PROCESSING" })
    .where(and(eq(emailCampaigns.id, campaignId), eq(emailCampaigns.status, "QUEUED")));

  const config = await loadMailConfig();

  const result = config
    ? (await sendMassEmail(config, [{ email, name }], subject, body))[0]
    : { to: email, ok: false, error: "Amazon SES is not configured — set it up under Admin -> Integrations." };

  if (result.ok) {
    await db
      .update(emailCampaignRecipients)
      .set({ status: "SENT", sentAt: new Date(), error: null })
      .where(eq(emailCampaignRecipients.id, recipientId));
    await db
      .update(emailCampaigns)
      .set({ successCount: sql`${emailCampaigns.successCount} + 1` })
      .where(eq(emailCampaigns.id, campaignId));
    await finalizeIfComplete(campaignId);
    return;
  }

  // Failed this attempt. Only record it as a terminal failure (and count it)
  // once BullMQ has no retries left — otherwise a job that succeeds on
  // attempt 2 would already be counted as one failure too many, and a
  // recipient marked FAILED here would stop the campaign from ever
  // finalizing correctly once a later retry succeeds.
  if (isLastAttempt) {
    await db
      .update(emailCampaignRecipients)
      .set({ status: "FAILED", error: result.error || "Unknown error" })
      .where(eq(emailCampaignRecipients.id, recipientId));
    await db
      .update(emailCampaigns)
      .set({ failureCount: sql`${emailCampaigns.failureCount} + 1` })
      .where(eq(emailCampaigns.id, campaignId));
    await finalizeIfComplete(campaignId);
  }

  throw new Error(result.error || "Send failed"); // lets BullMQ retry (or, on the last attempt, just records the failure in BullMQ's own job log)
}

const worker = new Worker<MassEmailJobData>(MASS_EMAIL_QUEUE_NAME, processJob, {
  connection: createRedisConnection(),
  concurrency: 5,
  limiter: MASS_EMAIL_RATE_LIMIT,
});

worker.on("completed", (job) => {
  console.log(`[email-worker] sent job ${job.id} -> ${job.data.email}`);
});

worker.on("failed", (job, err) => {
  const attempts = job ? `${job.attemptsMade}/${job.opts.attempts ?? DEFAULT_MAX_ATTEMPTS}` : "?";
  console.error(`[email-worker] job ${job?.id} (${job?.data.email}) attempt ${attempts} failed: ${err.message}`);
});

console.log(
  `[email-worker] listening on queue "${MASS_EMAIL_QUEUE_NAME}" (rate limit: ${MASS_EMAIL_RATE_LIMIT.max}/${MASS_EMAIL_RATE_LIMIT.duration}ms, concurrency: 5)`
);

process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});
