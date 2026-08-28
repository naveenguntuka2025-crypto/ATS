import { db } from "@/db/client";
import { jobBoardIntegrations, storageIntegrations, mailSettings, JOB_BOARD_PROVIDERS } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { saveJobBoardCredentialsAction, saveZohoCredentialsAction } from "@/lib/actions/integrations-actions";
import { saveSesSettingsAction } from "@/lib/actions/mail-actions";
import TestConnectionButton from "@/components/test-connection-button";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const PROVIDER_LABELS: Record<string, string> = {
  DICE: "Dice",
  LINKEDIN: "LinkedIn",
  MONSTER: "Monster",
  INDEED: "Indeed",
  CAREERBUILDER: "CareerBuilder",
  ZIPRECRUITER: "ZipRecruiter",
};

export default async function IntegrationsPage() {
  await requireRole("ADMIN");

  const jobBoardRows = await db.select().from(jobBoardIntegrations);
  const jobBoardByProvider = Object.fromEntries(jobBoardRows.map((r) => [r.provider, r]));

  const [zoho] = await db.select().from(storageIntegrations).where(eq(storageIntegrations.provider, "ZOHO_WORKDRIVE")).limit(1);
  const zohoCreds = zoho?.credentials ? JSON.parse(zoho.credentials) : {};

  const [ses] = await db.select().from(mailSettings).where(eq(mailSettings.provider, "SES")).limit(1);

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Integrations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Job boards require a partner API agreement before real data can flow — see the note on each card. Zoho
          WorkDrive is self-serve and works as soon as you add credentials below.
        </p>
      </div>

      <section className="card p-4">
        <h2 className="font-medium text-slate-900 mb-1">Document storage — Zoho WorkDrive</h2>
        <p className="text-xs text-slate-500 mb-4">
          Generate credentials at{" "}
          <a href="https://api-console.zoho.com" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
            api-console.zoho.com
          </a>{" "}
          (Self Client, scope <code>WorkDrive.files.ALL</code>). Until this is enabled and configured, resumes and
          other documents are stored locally.
        </p>
        <form action={saveZohoCredentialsAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Client ID</label>
              <input className="input" name="clientId" defaultValue={zohoCreds.clientId || ""} />
            </div>
            <div>
              <label className="label">Client secret</label>
              <input className="input" name="clientSecret" type="password" defaultValue={zohoCreds.clientSecret || ""} />
            </div>
            <div>
              <label className="label">Refresh token</label>
              <input className="input" name="refreshToken" type="password" defaultValue={zohoCreds.refreshToken || ""} />
            </div>
            <div>
              <label className="label">Root folder ID</label>
              <input className="input" name="rootFolderId" defaultValue={zohoCreds.rootFolderId || ""} />
            </div>
            <div>
              <label className="label">Accounts base URL (region)</label>
              <input className="input" name="accountsBaseUrl" placeholder="https://accounts.zoho.com" defaultValue={zohoCreds.accountsBaseUrl || ""} />
            </div>
            <div>
              <label className="label">API base URL (region)</label>
              <input className="input" name="apiBaseUrl" placeholder="https://www.zohoapis.com" defaultValue={zohoCreds.apiBaseUrl || ""} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="enabled" defaultChecked={!!zoho?.enabled} /> Enabled
          </label>
          <button type="submit" className="btn-primary">
            Save Zoho WorkDrive settings
          </button>
        </form>
      </section>

      <section className="card p-4">
        <h2 className="font-medium text-slate-900 mb-1">Mass email — Amazon SES</h2>
        <p className="text-xs text-slate-500 mb-4">
          Self-serve: verify a sending identity in the AWS SES console, create an IAM user/role with{" "}
          <code>ses:SendEmail</code>, and enter the access key below. New AWS accounts start in the SES sandbox and
          can only send to verified recipient addresses until you request production access.
        </p>
        <form action={saveSesSettingsAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Region</label>
              <input className="input" name="region" placeholder="us-east-1" defaultValue={ses?.region || ""} />
            </div>
            <div>
              <label className="label">From email (verified)</label>
              <input className="input" name="fromEmail" type="email" defaultValue={ses?.fromEmail || ""} />
            </div>
            <div>
              <label className="label">Access key ID</label>
              <input className="input" name="accessKeyId" defaultValue={ses?.accessKeyId || ""} />
            </div>
            <div>
              <label className="label">Secret access key</label>
              <input className="input" name="secretAccessKey" type="password" defaultValue={ses?.secretAccessKey || ""} />
            </div>
            <div>
              <label className="label">From name (optional)</label>
              <input className="input" name="fromName" defaultValue={ses?.fromName || ""} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="enabled" defaultChecked={!!ses?.enabled} /> Enabled
          </label>
          <button type="submit" className="btn-primary">
            Save Amazon SES settings
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-medium text-slate-900 mb-3">Job boards</h2>
        <div className="space-y-4">
          {JOB_BOARD_PROVIDERS.map((provider) => {
            const row = jobBoardByProvider[provider];
            const creds = row?.credentials ? JSON.parse(row.credentials) : {};
            const save = saveJobBoardCredentialsAction.bind(null, provider);
            return (
              <div key={provider} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-800">{PROVIDER_LABELS[provider]}</h3>
                  <span className={`badge ${row?.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {row?.enabled ? "Enabled" : "Not connected"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Requires a {PROVIDER_LABELS[provider]} technology/data partner agreement — see
                  lib/integrations/README.md. Runs in stub mode (simulated data) until real credentials are wired in.
                </p>
                <form action={save} className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-xs">API key</label>
                    <input className="input" name="apiKey" type="password" defaultValue={creds.apiKey || ""} />
                  </div>
                  <div>
                    <label className="label text-xs">Account ID</label>
                    <input className="input" name="accountId" defaultValue={creds.accountId || ""} />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-600 col-span-2">
                    <input type="checkbox" name="enabled" defaultChecked={!!row?.enabled} /> Enabled
                  </label>
                  <button type="submit" className="btn-secondary col-span-2">
                    Save
                  </button>
                </form>
                <TestConnectionButton provider={provider} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
