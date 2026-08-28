import { db } from "@/db/client";
import { clients, requirements } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const rows = await db
    .select({
      id: clients.id,
      name: clients.name,
      contactName: clients.contactName,
      contactEmail: clients.contactEmail,
      openReqs: sql<number>`count(case when ${requirements.status} = 'OPEN' then 1 end)`,
    })
    .from(clients)
    .leftJoin(requirements, eq(requirements.clientId, clients.id))
    .groupBy(clients.id)
    .orderBy(desc(clients.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500 mt-1">Companies you're staffing for.</p>
        </div>
        <Link href="/clients/new" className="btn-primary">
          + New client
        </Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Contact</th>
              <th className="px-4 py-2 font-medium">Open requirements</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/clients/${c.id}`} className="font-medium text-slate-800 hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {c.contactName || "—"} {c.contactEmail ? `· ${c.contactEmail}` : ""}
                </td>
                <td className="px-4 py-3 text-slate-700">{c.openReqs}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                  No clients yet — add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
