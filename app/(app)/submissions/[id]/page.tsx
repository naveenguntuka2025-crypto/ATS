import { db } from "@/db/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, humanize, submissionStatusColor } from "@/lib/utils";
import { updateSubmissionStatusAction } from "@/lib/actions/submissions-actions";
import { addNoteAction } from "@/lib/actions/notes-actions";
import { SUBMISSION_STATUSES } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const submission = await db.query.submissions.findFirst({
    where: (s, { eq }) => eq(s.id, params.id),
    with: {
      candidate: true,
      requirement: { with: { client: true } },
      submittedBy: true,
      statusHistory: { orderBy: (h, { desc }) => [desc(h.changedAt)] },
      notes: { with: { author: true }, orderBy: (n, { desc }) => [desc(n.createdAt)] },
    },
  });
  if (!submission) notFound();

  const path = `/submissions/${submission.id}`;
  const addNote = addNoteAction.bind(null, { submissionId: submission.id }, path);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            <Link href={`/candidates/${submission.candidateId}`} className="hover:underline">
              {submission.candidate?.firstName} {submission.candidate?.lastName}
            </Link>{" "}
            <span className="text-slate-400 font-normal">→</span>{" "}
            <Link href={`/requirements/${submission.requirementId}`} className="hover:underline">
              {submission.requirement?.title}
            </Link>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {submission.requirement?.client?.name} · submitted by {submission.submittedBy?.name} on{" "}
            {formatDate(submission.createdAt)}
            {submission.submittedRate ? ` · $${submission.submittedRate}/hr` : ""}
          </p>
        </div>
        <span className={`badge shrink-0 ${submissionStatusColor(submission.status)}`}>{humanize(submission.status)}</span>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="card p-4">
            <h2 className="font-medium text-slate-900 mb-3 text-sm">Update status</h2>
            <div className="flex flex-wrap gap-2">
              {SUBMISSION_STATUSES.map((s) => (
                <form key={s} action={updateSubmissionStatusAction.bind(null, submission.id, s, path)}>
                  <button
                    type="submit"
                    className={`badge ${s === submission.status ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    {humanize(s)}
                  </button>
                </form>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h2 className="font-medium text-slate-900 mb-3">Notes</h2>
            <form action={addNote} className="flex gap-2 mb-4">
              <input className="input" name="body" placeholder="Add a note..." required />
              <button className="btn-secondary shrink-0" type="submit">
                Post
              </button>
            </form>
            <ul className="space-y-3">
              {submission.notes.map((n) => (
                <li key={n.id} className="text-sm">
                  <span className="font-medium text-slate-800">{n.author?.name}</span>{" "}
                  <span className="text-slate-400 text-xs">{formatDate(n.createdAt)}</span>
                  <p className="text-slate-600">{n.body}</p>
                </li>
              ))}
              {submission.notes.length === 0 && <li className="text-sm text-slate-400">No notes yet.</li>}
            </ul>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="font-medium text-slate-900 mb-2 text-sm">Status history</h2>
          <ul className="space-y-2 text-sm">
            {submission.statusHistory.map((h) => (
              <li key={h.id} className="text-slate-600">
                <span className="font-medium">{humanize(h.toStatus)}</span>
                <span className="text-xs text-slate-400 block">{formatDate(h.changedAt)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
