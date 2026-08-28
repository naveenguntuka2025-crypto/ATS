import { db } from "@/db/client";
import { createRequirementAction } from "@/lib/actions/requirements-actions";
import { requireRole } from "@/lib/auth";

export default async function NewRequirementPage() {
  await requireRole("ADMIN", "MANAGER");
  const clients = await db.query.clients.findMany({ orderBy: (c, { asc }) => [asc(c.name)] });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">New requirement</h1>
      <form action={createRequirementAction} className="card p-6 space-y-4">
        <div>
          <label className="label">Title *</label>
          <input className="input" name="title" required placeholder="Senior React Developer" />
        </div>

        <div>
          <label className="label">Client *</label>
          <select className="input" name="clientId" required defaultValue="">
            <option value="" disabled>
              Select a client
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {clients.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              No clients yet — <a href="/clients/new" className="underline">create one first</a>.
            </p>
          )}
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input" name="description" rows={4} />
        </div>

        <div>
          <label className="label">Required skills (comma-separated)</label>
          <input className="input" name="skills" placeholder="React, TypeScript, AWS" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Location</label>
            <input className="input" name="location" placeholder="Remote / City, ST" />
          </div>
          <div>
            <label className="label">Employment type</label>
            <select className="input" name="employmentType" defaultValue="W2">
              <option value="W2">W2</option>
              <option value="C2C">C2C</option>
              <option value="C1099">1099</option>
              <option value="FULL_TIME">Full-time</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Rate min ($/hr)</label>
            <input className="input" name="rateMin" type="number" step="0.01" />
          </div>
          <div>
            <label className="label">Rate max ($/hr)</label>
            <input className="input" name="rateMax" type="number" step="0.01" />
          </div>
          <div>
            <label className="label"># Positions</label>
            <input className="input" name="positions" type="number" defaultValue={1} min={1} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Priority</label>
            <select className="input" name="priority" defaultValue="MEDIUM">
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div>
            <label className="label">Due date</label>
            <input className="input" name="dueDate" type="date" />
          </div>
        </div>

        <button type="submit" className="btn-primary">
          Create requirement
        </button>
      </form>
    </div>
  );
}
