import { db } from "@/db/client";
import Link from "next/link";
import { formatDate, humanize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CandidatesPage({ searchParams }: { searchParams: { q?: string } }) {
  const all = await db.query.candidates.findMany({
    orderBy: (c, { desc }) => [desc(c.createdAt)],
    with: { owner: true },
  });

  const q = (searchParams.q || "").toLowerCase().trim();
  const filtered = q
    ? all.filter((c) =>
        [c.firstName, c.lastName, c.currentTitle, c.skills, c.location].join(" ").toLowerCase().includes(q)
      )
    : all;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Candidates</h1>
          <p className="text-sm text-slate-500 mt-1">Shared candidate pool across all recruiters.</p>
        </div>
        <Link href="/candidates/new" className="btn-primary">
          + Add candidate
        </Link>
      </div>

      <form className="max-w-sm">
        <input className="input" name="q" placeholder="Search name, title, skill, location..." defaultValue={q} />
      </form>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Skills</th>
              <th className="px-4 py-2 font-medium">Source</th>
              <th className="px-4 py-2 font-medium">Owner</th>
              <th className="px-4 py-2 font-medium">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/candidates/${c.id}`} className="font-medium text-slate-800 hover:underline">
                    {c.firstName} {c.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.currentTitle || "—"}</td>
                <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{c.skills || "—"}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-slate-100 text-slate-600">{humanize(c.source)}</span>
                </td>
                <td className="px-4 py-3 text-slate-500">{c.owner?.name}</td>
                <td className="px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No candidates match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
