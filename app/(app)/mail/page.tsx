import { db } from "@/db/client";
import { candidates, emailCampaigns, mailSettings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { sendMassEmailAction } from "@/lib/actions/mail-actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MassMailPage({ searchParams }: { searchParams: { queued?: string; error?: string } }) {
  const [allCandidates, [config], campaigns] = await Promise.all([
    db.select({ id: candidates.id, firstName: candidates.firstName, lastName: candidates.lastName, email: candidates.email, currentTitle: candidates.currentTitle }).from(candidates),
    db.select().from(mailSettings).where(eq(mailSettings.provider, "SES")).limit(1),
    db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt)).limit(10),
  ]);

  const withEmail = allCandidates.filter((c) => c.email);
  const configured = !!config?.enabled;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Mass email</h1>
        <p className="text-sm text-slate-500 mt-1">Send an email to a set of candidates via Amazon SES.</p>
      </div>

      {!configured && (
        <div className="rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3">
          Amazon SES isn't configured yet. An admin can set it up under{" "}
          <a href="/admin/integrations" className="underline">
            Admin → Integrations
          </a>
          .
        </div>
      )}
      {searchParams.queued && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3">
          Campaign queued — it's sending in the background at a throttled rate. Refresh to watch progress below.
        </div>
      )}
      {searchParams.error === "not_configured" && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          Couldn't queue — Amazon SES isn't configured.
        </div>
      )}
      {searchParams.error === "no_recipients" && (
        <div className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          None of the selected candidates have an email on file.
        </div>
      )}

      <form action={sendMassEmailAction} className="card p-6 space-y-4">
        <div>
          <label className="label">Recipients ({withEmail.length} candidates have an email on file)</label>
          <div className="border border-slate-200 rounded-md max-h-48 overflow-auto p-2 space-y-1">
            {withEmail.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm px-1 py-0.5">
                <input type="checkbox" name="candidateIds" value={c.id} />
                <span>
                  {c.firstName} {c.lastName} <span className="text-slate-400">— {c.email}</span>
                </span>
              </label>
            ))}
            {withEmail.length === 0 && <p className="text-sm text-slate-400 px-1 py-2">No candidates with an email address yet.</p>}
          </div>
        </div>

        <div>
          <label className="label">Subject</label>
          <input className="input" name="subject" required />
        </div>
        <div>
          <label className="label">Message</label>
          <textarea className="input" name="body" rows={6} required placeholder="Hi {{name}}, ..." />
          <p className="text-xs text-slate-400 mt-1">Use <code>{"{{name}}"}</code> to personalize with the candidate's first name.</p>
        </div>

        <button type="submit" className="btn-primary" disabled={!configured || withEmail.length === 0}>
          Queue campaign
        </button>
        <p className="text-xs text-slate-400">
          Sending happens in the background at a throttled rate (see Admin → Integrations for setup notes) — this
          page returns instantly instead of waiting on hundreds of API calls.
        </p>
      </form>

      <div className="card">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="font-medium text-slate-900">Recent campaigns</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {campaigns.map((c) => (
            <li key={c.id} className="px-4 py-3 text-sm flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{c.subject}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(c.createdAt)} · {c.successCount}/{c.recipientCount} delivered
                  {c.failureCount > 0 ? ` · ${c.failureCount} failed` : ""}
                </p>
              </div>
              <span className={`badge ${CAMPAIGN_STATUS_COLORS[c.status] || "bg-slate-100 text-slate-600"}`}>{c.status}</span>
            </li>
          ))}
          {campaigns.length === 0 && <li className="px-4 py-6 text-sm text-slate-400">No campaigns yet.</li>}
        </ul>
      </div>
    </div>
  );
}

const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  QUEUED: "bg-slate-100 text-slate-600",
  PROCESSING: "bg-blue-100 text-blue-700",
  SENT: "bg-emerald-100 text-emerald-700",
  PARTIAL: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
};
