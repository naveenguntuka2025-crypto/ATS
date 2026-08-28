import { db } from "@/db/client";
import { users } from "@/db/schema";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  updateRequirementStatusAction,
  assignRecruiterAction,
  unassignRecruiterAction,
} from "@/lib/actions/requirements-actions";
import { addNoteAction } from "@/lib/actions/notes-actions";
import {
  formatDate,
  formatRate,
  priorityColor,
  requirementStatusColor,
  submissionStatusColor,
  humanize,
} from "@/lib/utils";
import { REQUIREMENT_STATUSES } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function RequirementDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const req = await db.query.requirements.findFirst({
    where: (r, { eq }) => eq(r.id, params.id),
    with: {
      client: true,
      postedBy: true,
      assignees: { with: { user: true } },
      submissions: { with: { candidate: true }, orderBy: (s, { desc }) => [desc(s.createdAt)] },
      notes: { with: { author: true }, orderBy: (n, { desc }) => [desc(n.createdAt)] },
    },
  });
  if (!req) notFound();

  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";
  const allRecruiters = canManage ? await db.select().from(users) : [];
  const assignedIds = new Set(req.assignees.map((a) => a.userId));
  const unassigned = allRecruiters.filter((u) => !assignedIds.has(u.id) && u.role !== "ADMIN");

  const updateStatus = updateRequirementStatusAction.bind(null, req.id);
  const assign = assignRecruiterAction.bind(null, req.id);
  const addNote = addNoteAction.bind(null, { requirementId: req.id }, `/requirements/${req.id}`);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">{req.title}</h1>
            <span className={`badge ${priorityColor(req.priority)}`}>{req.priority}</span>
            <span className={`badge ${requirementStatusColor(req.status)}`}>{humanize(req.status)}</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            <Link href={`/clients/${req.clientId}`} className="hover:underline">
              {req.client?.name}
            </Link>{" "}
            · {req.location || "Location TBD"} · posted by {req.postedBy?.name} on {formatDate(req.createdAt)}
          </p>
        </div>
        <Link href={`/submissions/new?requirementId=${req.id}`} className="btn-primary shrink-0">
          + Submit candidate
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="card p-4">
            <h2 className="font-medium text-slate-900 mb-2">Description</h2>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{req.description || "No description provided."}</p>
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs">Skills</p>
                <p className="text-slate-700">{req.skills || "—"}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Employment type</p>
                <p className="text-slate-700">{humanize(req.employmentType)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Rate</p>
                <p className="text-slate-700">{formatRate(req.rateMin, req.rateMax)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Positions</p>
                <p className="text-slate-700">{req.positions}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Due date</p>
                <p className="text-slate-700">{formatDate(req.dueDate)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="px-4 py-3 border-b border-slate-200">
              <h2 className="font-medium text-slate-900">Submissions ({req.submissions.length})</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {req.submissions.map((s) => (
                <li key={s.id} className="px-4 py-3">
                  <Link href={`/submissions/${s.id}`} className="flex items-center justify-between">
                    <span className="text-slate-800 font-medium">
                      {s.candidate?.firstName} {s.candidate?.lastName}
                    </span>
                    <span className={`badge ${submissionStatusColor(s.status)}`}>{humanize(s.status)}</span>
                  </Link>
                </li>
              ))}
              {req.submissions.length === 0 && (
                <li className="px-4 py-6 text-sm text-slate-400">No candidates submitted yet.</li>
              )}
            </ul>
          </div>

          <div className="card p-4">
            <h2 className="font-medium text-slate-900 mb-3">Notes / activity</h2>
            <form action={addNote} className="flex gap-2 mb-4">
              <input className="input" name="body" placeholder="Add a note visible to the whole team..." required />
              <button className="btn-secondary shrink-0" type="submit">
                Post
              </button>
            </form>
            <ul className="space-y-3">
              {req.notes.map((n) => (
                <li key={n.id} className="text-sm">
                  <span className="font-medium text-slate-800">{n.author?.name}</span>{" "}
                  <span className="text-slate-400 text-xs">{formatDate(n.createdAt)}</span>
                  <p className="text-slate-600">{n.body}</p>
                </li>
              ))}
              {req.notes.length === 0 && <li className="text-sm text-slate-400">No notes yet.</li>}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          {canManage && (
            <div className="card p-4">
              <h2 className="font-medium text-slate-900 mb-2 text-sm">Status</h2>
              <div className="flex flex-wrap gap-2">
                {REQUIREMENT_STATUSES.map((s) => (
                  <form key={s} action={updateStatus.bind(null, s)}>
                    <button
                      type="submit"
                      className={`badge ${s === req.status ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      {humanize(s)}
                    </button>
                  </form>
                ))}
              </div>
            </div>
          )}

          <div className="card p-4">
            <h2 className="font-medium text-slate-900 mb-2 text-sm">Assigned recruiters</h2>
            <ul className="space-y-2 mb-3">
              {req.assignees.map((a) => (
                <li key={a.userId} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{a.user.name}</span>
                  {canManage && (
                    <form action={unassignRecruiterAction.bind(null, req.id, a.userId)}>
                      <button className="text-xs text-red-500 hover:underline" type="submit">
                        Remove
                      </button>
                    </form>
                  )}
                </li>
              ))}
              {req.assignees.length === 0 && <li className="text-sm text-slate-400">Unassigned</li>}
            </ul>
            {canManage && unassigned.length > 0 && (
              <form action={assign} className="flex gap-2">
                <select className="input" name="userId" required defaultValue="">
                  <option value="" disabled>
                    Add recruiter...
                  </option>
                  {unassigned.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <button className="btn-secondary shrink-0" type="submit">
                  Add
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
