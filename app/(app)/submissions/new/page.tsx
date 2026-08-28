import { db } from "@/db/client";
import { createSubmissionAction } from "@/lib/actions/submissions-actions";

export default async function NewSubmissionPage({
  searchParams,
}: {
  searchParams: { requirementId?: string; candidateId?: string };
}) {
  const [requirements, candidates] = await Promise.all([
    db.query.requirements.findMany({
      where: (r, { eq }) => eq(r.status, "OPEN"),
      with: { client: true },
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    }),
    db.query.candidates.findMany({ orderBy: (c, { desc }) => [desc(c.createdAt)] }),
  ]);

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">New submission</h1>
      <form action={createSubmissionAction} className="card p-6 space-y-4">
        <div>
          <label className="label">Candidate *</label>
          <select className="input" name="candidateId" required defaultValue={searchParams.candidateId || ""}>
            <option value="" disabled>
              Select a candidate
            </option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName} {c.currentTitle ? `— ${c.currentTitle}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Requirement *</label>
          <select className="input" name="requirementId" required defaultValue={searchParams.requirementId || ""}>
            <option value="" disabled>
              Select an open requirement
            </option>
            {requirements.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title} — {r.client?.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Submitted rate ($/hr)</label>
          <input className="input" name="submittedRate" type="number" step="0.01" />
        </div>

        <button type="submit" className="btn-primary">
          Submit candidate
        </button>
      </form>
    </div>
  );
}
