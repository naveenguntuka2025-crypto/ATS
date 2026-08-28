import { createClientAction } from "@/lib/actions/clients-actions";

export default function NewClientPage() {
  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">New client</h1>
      <form action={createClientAction} className="card p-6 space-y-4">
        <div>
          <label className="label">Client name *</label>
          <input className="input" name="name" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Contact name</label>
            <input className="input" name="contactName" />
          </div>
          <div>
            <label className="label">Contact email</label>
            <input className="input" name="contactEmail" type="email" />
          </div>
        </div>
        <div>
          <label className="label">Contact phone</label>
          <input className="input" name="contactPhone" />
        </div>
        <div>
          <label className="label">Notes</label>
          <textarea className="input" name="notes" rows={3} />
        </div>
        <button type="submit" className="btn-primary">
          Create client
        </button>
      </form>
    </div>
  );
}
