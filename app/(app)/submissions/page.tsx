import { db } from "@/db/client";
import Link from "next/link";
import { formatDate, humanize, submissionStatusColor } from "@/lib/utils";
import { SUBMISSION_STATUSES } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const all = await db.query.submissions.findMany({
    orderBy: (s, { desc }) => [desc(s.createdAt)],
    with: { candidate: true, requirement: { with: { client: true } }, submittedBy: true },
  });

  const byStatus = SUBMISSION_STATUSES.map((status) => ({
    status,
    items: all.filter((s) => s.status === status),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Submissions</h1>
          <p className="text-sm text-slate-500 mt-1">Resume submissions pipeline — shared across recruiters and managers.</p>
        </div>
        <Link href="/submissions/new" className="btn-primary">
          + New submission
        </Link>
      </div>

      {all.length === 0 && <div className="card p-8 text-center text-slate-400 text-sm">No submissions yet.</div>}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {byStatus.map((group) => (
          <div key={group.status} className="card">
            <div className="px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <span className={`badge ${submissionStatusColor(group.status)}`}>{humanize(group.status)}</span>
              <span className="text-xs text-slate-400">{group.items.length}</span>
            </div>
            <ul className="divide-y divide-slate-100">
              {group.items.map((s) => (
                <li key={s.id} className="px-4 py-3 text-sm">
                  <Link href={`/submissions/${s.id}`} className="block">
                    <p className="font-medium text-slate-800">
                      {s.candidate?.firstName} {s.candidate?.lastName}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {s.requirement?.title} · {s.requirement?.client?.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      by {s.submittedBy?.name} · {formatDate(s.createdAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
