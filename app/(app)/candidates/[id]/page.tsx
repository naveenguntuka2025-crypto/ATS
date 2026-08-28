import { db } from "@/db/client";
import { documents } from "@/db/schema";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, humanize, submissionStatusColor } from "@/lib/utils";
import { addNoteAction } from "@/lib/actions/notes-actions";
import { uploadDocumentAction, deleteDocumentAction } from "@/lib/actions/documents-actions";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function CandidateDetailPage({ params }: { params: { id: string } }) {
  const candidate = await db.query.candidates.findFirst({
    where: (c, { eq }) => eq(c.id, params.id),
    with: {
      owner: true,
      notes: { with: { author: true }, orderBy: (n, { desc }) => [desc(n.createdAt)] },
      submissions: { with: { requirement: { with: { client: true } } }, orderBy: (s, { desc }) => [desc(s.createdAt)] },
    },
  });
  if (!candidate) notFound();

  const docs = await db
    .select()
    .from(documents)
    .where(and(eq(documents.entityType, "CANDIDATE"), eq(documents.entityId, candidate.id)))
    .orderBy(desc(documents.createdAt));

  const path = `/candidates/${candidate.id}`;
  const addNote = addNoteAction.bind(null, { candidateId: candidate.id }, path);
  const upload = uploadDocumentAction.bind(null, "CANDIDATE", candidate.id, path);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          {candidate.firstName} {candidate.lastName}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {candidate.currentTitle || "No title"} · {candidate.location || "Location unknown"} · owned by {candidate.owner?.name}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="card p-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400 text-xs">Email</p>
              <p className="text-slate-700">{candidate.email || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Phone</p>
              <p className="text-slate-700">{candidate.phone || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Skills</p>
              <p className="text-slate-700">{candidate.skills || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Experience</p>
              <p className="text-slate-700">{candidate.experienceYears ? `${candidate.experienceYears} yrs` : "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Work authorization</p>
              <p className="text-slate-700">{candidate.workAuthorization || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Source</p>
              <p className="text-slate-700">{humanize(candidate.source)}</p>
            </div>
          </div>

          <div className="card">
            <div className="px-4 py-3 border-b border-slate-200">
              <h2 className="font-medium text-slate-900">Submission history ({candidate.submissions.length})</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {candidate.submissions.map((s) => (
                <li key={s.id} className="px-4 py-3">
                  <Link href={`/submissions/${s.id}`} className="flex items-center justify-between">
                    <span className="text-slate-800">
                      {s.requirement?.title}{" "}
                      <span className="text-slate-400 text-xs">· {s.requirement?.client?.name}</span>
                    </span>
                    <span className={`badge ${submissionStatusColor(s.status)}`}>{humanize(s.status)}</span>
                  </Link>
                </li>
              ))}
              {candidate.submissions.length === 0 && (
                <li className="px-4 py-6 text-sm text-slate-400">Not submitted to any requirement yet.</li>
              )}
            </ul>
          </div>

          <div className="card p-4">
            <h2 className="font-medium text-slate-900 mb-3">Notes / activity</h2>
            <form action={addNote} className="flex gap-2 mb-4">
              <input className="input" name="body" placeholder="Add a note..." required />
              <button className="btn-secondary shrink-0" type="submit">
                Post
              </button>
            </form>
            <ul className="space-y-3">
              {candidate.notes.map((n) => (
                <li key={n.id} className="text-sm">
                  <span className="font-medium text-slate-800">{n.author?.name}</span>{" "}
                  <span className="text-slate-400 text-xs">{formatDate(n.createdAt)}</span>
                  <p className="text-slate-600">{n.body}</p>
                </li>
              ))}
              {candidate.notes.length === 0 && <li className="text-sm text-slate-400">No notes yet.</li>}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-4">
            <h2 className="font-medium text-slate-900 mb-2 text-sm">Documents</h2>
            <form action={upload} className="space-y-2 mb-4" encType="multipart/form-data">
              <select className="input" name="category" defaultValue="RESUME">
                <option value="RESUME">Resume</option>
                <option value="OFFER_LETTER">Offer letter</option>
                <option value="ID_PROOF">ID proof</option>
                <option value="OTHER">Other</option>
              </select>
              <input className="input" name="file" type="file" required />
              <button className="btn-secondary w-full" type="submit">
                Upload
              </button>
            </form>
            <ul className="space-y-2">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <a href={d.url || "#"} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline truncate">
                    {d.fileName}
                  </a>
                  <form action={deleteDocumentAction.bind(null, d.id, path)}>
                    <button className="text-xs text-red-500 hover:underline" type="submit">
                      Delete
                    </button>
                  </form>
                </li>
              ))}
              {docs.length === 0 && <li className="text-sm text-slate-400">No documents uploaded.</li>}
            </ul>
            <p className="text-xs text-slate-400 mt-3">
              Stored via {docs[0]?.storageProvider === "ZOHO_WORKDRIVE" ? "Zoho WorkDrive" : "local storage (default until Zoho WorkDrive is configured in Admin -> Integrations)"}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
