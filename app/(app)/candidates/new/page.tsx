import { createCandidateAction } from "@/lib/actions/candidates-actions";

export default function NewCandidatePage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Add candidate</h1>
      <form action={createCandidateAction} className="card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First name *</label>
            <input className="input" name="firstName" required />
          </div>
          <div>
            <label className="label">Last name *</label>
            <input className="input" name="lastName" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Email</label>
            <input className="input" name="email" type="email" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" name="phone" />
          </div>
        </div>
        <div>
          <label className="label">Current title</label>
          <input className="input" name="currentTitle" placeholder="Senior Java Developer" />
        </div>
        <div>
          <label className="label">Skills (comma-separated)</label>
          <input className="input" name="skills" placeholder="Java, Spring Boot, Kafka" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">Experience (years)</label>
            <input className="input" name="experienceYears" type="number" step="0.5" />
          </div>
          <div>
            <label className="label">Location</label>
            <input className="input" name="location" />
          </div>
          <div>
            <label className="label">Work authorization</label>
            <input className="input" name="workAuthorization" placeholder="USC / GC / H1B / OPT..." />
          </div>
        </div>
        <div>
          <label className="label">Source</label>
          <select className="input" name="source" defaultValue="INTERNAL">
            <option value="INTERNAL">Internal / sourced</option>
            <option value="REFERRAL">Referral</option>
            <option value="DICE">Dice</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="MONSTER">Monster</option>
            <option value="INDEED">Indeed</option>
            <option value="CAREERBUILDER">CareerBuilder</option>
            <option value="ZIPRECRUITER">ZipRecruiter</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <p className="text-xs text-slate-400">
          Resume upload is available from the candidate's detail page once created.
        </p>
        <button type="submit" className="btn-primary">
          Add candidate
        </button>
      </form>
    </div>
  );
}
