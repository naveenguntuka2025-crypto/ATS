import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { db } from "@/db/client";
import { mailSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

// Real Amazon SES integration — self-serve, no partner agreement needed.
// Setup:
//   1. In AWS Console -> SES: verify a sending identity (domain or email).
//   2. New accounts start in the SES "sandbox" — you can only send to
//      verified recipient addresses until you request production access
//      (Account dashboard -> Request production access). Keep this in mind
//      when testing: sends to unverified candidate emails will fail while
//      in the sandbox.
//   3. Create an IAM user/role with ses:SendEmail permission, generate an
//      access key, and enter it under Admin -> Integrations -> Amazon SES.
//      For production, prefer an IAM role over long-lived access keys.

export type MailConfig = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  fromEmail: string;
  fromName?: string;
};

export async function loadMailConfig(): Promise<MailConfig | null> {
  const [row] = await db.select().from(mailSettings).where(eq(mailSettings.provider, "SES")).limit(1);
  if (!row || !row.enabled) return null;
  if (!row.region || !row.accessKeyId || !row.secretAccessKey || !row.fromEmail) return null;
  return {
    region: row.region,
    accessKeyId: row.accessKeyId,
    secretAccessKey: row.secretAccessKey,
    fromEmail: row.fromEmail,
    fromName: row.fromName || undefined,
  };
}

export async function isSesConfigured(): Promise<boolean> {
  return (await loadMailConfig()) !== null;
}

export type SendResult = { to: string; ok: boolean; error?: string };

/**
 * Sends one email per recipient (SES doesn't do true one-call bulk send for
 * personalized plain messages; SendBulkEmail with templates is an option for
 * higher volume later). Sends are sequential with a small delay to stay well
 * under SES's default rate limit — tune once you know your account's quota.
 */
export async function sendMassEmail(
  config: MailConfig,
  recipients: { email: string; name?: string }[],
  subject: string,
  body: string
): Promise<SendResult[]> {
  const client = new SESClient({
    region: config.region,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });

  const source = config.fromName ? `${config.fromName} <${config.fromEmail}>` : config.fromEmail;
  const results: SendResult[] = [];

  for (const r of recipients) {
    try {
      const personalizedBody = body.replaceAll("{{name}}", r.name || "there");
      await client.send(
        new SendEmailCommand({
          Source: source,
          Destination: { ToAddresses: [r.email] },
          Message: {
            Subject: { Data: subject, Charset: "UTF-8" },
            Body: { Text: { Data: personalizedBody, Charset: "UTF-8" } },
          },
        })
      );
      results.push({ to: r.email, ok: true });
    } catch (err: any) {
      results.push({ to: r.email, ok: false, error: err?.message || String(err) });
    }
    // Gentle pacing to avoid tripping SES rate limits on larger batches.
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return results;
}
