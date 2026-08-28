import { db } from "@/db/client";
import { requirements, submissions, candidates, clients, users } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import Link from "next/link";
import { formatDate, priorityColor, requirementStatusColor, submissionStatusColor, humanize } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getStats() {
  const [[openReqs], [totalCandidates], [placed], [totalSubs]] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(requirements).where(eq(requirements.status, "OPEN")),
    db.select({ count: sql<number>`count(*)` }).from(candidates),
    db.select({ count: sql<number>`count(*)` }).from(submissions).where(eq(submissions.status, "PLACED")),
    db.select({ count: sql<number>`count(*)` }).from(submissions),
  ]);
  return {
    openReqs: openReqs.count,
    totalCandidates: totalCandidates.count,
    placed: placed.count,
    totalSubs: totalSubs.count,
  };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const recentRequirements = await db.query.requirements.findMany({
    orderBy: [desc(requirements.createdAt)],
    limit: 5,
    with: { client: true, postedBy: true },
  });

  const recentSubmissions = await db.query.submissions.findMany({
    orderBy: [desc(submissions.createdAt)],
    limit: 6,
    with: { candidate: true, requirement: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Shared, real-time view across the whole team.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Open requirements" value={stats.openReqs} />
        <StatCard label="Total candidates" value={stats.totalCandidates} />
        <StatCard label="Total submissions" value={stats.totalSubs} />
        <StatCard label="Placements" value={stats.placed} accent />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-medium text-slate-900">Recent requirements</h2>
            <Link href="/requirements" className="text-sm text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {recentRequirements.length === 0 && <li className="px-4 py-6 text-sm text-slate-400">No requirements yet.</li>}
            {recentRequirements.map((r) => (
              <li key={r.id} className="px-4 py-3">
                <Link href={`/requirements/${r.id}`} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{r.title}</p>
                    <p className="text-xs text-slate-500">
                      {r.client?.name} · posted by {r.postedBy?.name} · {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <span className={`badge ${priorityColor(r.priority)}`}>{r.priority}</span>
                    <span className={`badge ${requirementStatusColor(r.status)}`}>{humanize(r.status)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-medium text-slate-900">Recent submissions</h2>
            <Link href="/submissions" className="text-sm text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-slate-100">
            {recentSubmissions.length === 0 && <li className="px-4 py-6 text-sm text-slate-400">No submissions yet.</li>}
            {recentSubmissions.map((s) => (
              <li key={s.id} className="px-4 py-3">
                <Link href={`/submissions/${s.id}`} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">
                      {s.candidate?.firstName} {s.candidate?.lastName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      → {s.requirement?.title} · {formatDate(s.createdAt)}
                    </p>
                  </div>
                  <span className={`badge shrink-0 ${submissionStatusColor(s.status)}`}>{humanize(s.status)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="card p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${accent ? "text-emerald-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
