import { db } from "@/db/client";
import Link from "next/link";
import { formatDate, priorityColor, requirementStatusColor, humanize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RequirementsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const all = await db.query.requirements.findMany({
    orderBy: (r, { desc }) => [desc(r.createdAt)],
    with: { client: true, assignees: { with: { user: true } } },
  });

  const filtered = searchParams.status ? all.filter((r) => r.status === searchParams.status) : all;
  const statuses = ["OPEN", "ON_HOLD", "FILLED", "CLOSED"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Requirements</h1>
          <p className="text-sm text-slate-500 mt-1">Daily open requirements from managers — shared across the team.</p>
        </div>
        <Link href="/requirements/new" className="btn-primary">
          + New requirement
        </Link>
      </div>

      <div className="flex gap-2 text-sm">
        <Link href="/requirements" className={`badge ${!searchParams.status ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"}`}>
          All ({all.length})
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/requirements?status=${s}`}
            className={`badge ${searchParams.status === s ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {humanize(s)} ({all.filter((r) => r.status === s).length})
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Assigned to</th>
              <th className="px-4 py-2 font-medium">Priority</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Posted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/requirements/${r.id}`} className="font-medium text-slate-800 hover:underline">
                    {r.title}
                  </Link>
                  <div className="text-xs text-slate-500">{r.location}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{r.client?.name}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  {r.assignees.map((a) => a.user.name).join(", ") || "Unassigned"}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${priorityColor(r.priority)}`}>{r.priority}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${requirementStatusColor(r.status)}`}>{humanize(r.status)}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(r.createdAt)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No requirements match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
