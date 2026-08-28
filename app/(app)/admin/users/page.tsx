import { db } from "@/db/client";
import { users } from "@/db/schema";
import { requireRole } from "@/lib/auth";
import { createUserAction, toggleUserActiveAction } from "@/lib/actions/auth-actions";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireRole("ADMIN");
  const allUsers = await db.select().from(users).orderBy(users.createdAt);

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-1">Manage recruiter, manager, and admin accounts.</p>
        </div>
        <Link href="/admin/integrations" className="text-sm text-brand-600 hover:underline">
          Integration settings →
        </Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Joined</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allUsers.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-slate-100 text-slate-600">{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {u.active ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <form action={toggleUserActiveAction.bind(null, u.id, !u.active)}>
                    <button className="text-xs text-slate-500 hover:underline" type="submit">
                      {u.active ? "Disable" : "Enable"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-6">
        <h2 className="font-medium text-slate-900 mb-4">Add user</h2>
        <form action={createUserAction} className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Name</label>
            <input className="input" name="name" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" name="email" type="email" required />
          </div>
          <div>
            <label className="label">Temporary password</label>
            <input className="input" name="password" type="password" required minLength={8} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" name="role" defaultValue="RECRUITER">
              <option value="RECRUITER">Recruiter</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="col-span-2">
            <button type="submit" className="btn-primary">
              Create user
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
