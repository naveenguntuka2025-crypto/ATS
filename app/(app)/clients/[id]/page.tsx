import { db } from "@/db/client";
import { requirementStatusColor, priorityColor, humanize, formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await db.query.clients.findFirst({
    where: (c, { eq }) => eq(c.id, params.id),
    with: { owner: true, requirements: { orderBy: (r, { desc }) => [desc(r.createdAt)] } },
  });
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{client.name}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {client.contactName} {client.contactEmail ? `· ${client.contactEmail}` : ""}{" "}
          {client.contactPhone ? `· ${client.contactPhone}` : ""}
        </p>
      </div>

      {client.notes && <div className="card p-4 text-sm text-slate-600">{client.notes}</div>}

      <div className="card">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-medium text-slate-900">Requirements ({client.requirements.length})</h2>
          <Link href="/requirements/new" className="text-sm text-brand-600 hover:underline">
            + New requirement
          </Link>
        </div>
        <ul className="divide-y divide-slate-100">
          {client.requirements.map((r) => (
            <li key={r.id} className="px-4 py-3">
              <Link href={`/requirements/${r.id}`} className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-800">{r.title}</p>
                  <p className="text-xs text-slate-500">{formatDate(r.createdAt)}</p>
                </div>
                <div className="flex gap-1">
                  <span className={`badge ${priorityColor(r.priority)}`}>{r.priority}</span>
                  <span className={`badge ${requirementStatusColor(r.status)}`}>{humanize(r.status)}</span>
                </div>
              </Link>
            </li>
          ))}
          {client.requirements.length === 0 && (
            <li className="px-4 py-6 text-sm text-slate-400">No requirements for this client yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
