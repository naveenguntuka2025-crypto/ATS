import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth-actions";
import type { SessionUser } from "@/lib/auth";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/requirements", label: "Requirements" },
  { href: "/candidates", label: "Candidates" },
  { href: "/submissions", label: "Submissions" },
  { href: "/clients", label: "Clients" },
  { href: "/mail", label: "Mass Email" },
];

export default function Nav({ user }: { user: SessionUser }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-slate-900 flex items-center gap-2">
            <span className="h-6 w-6 rounded bg-brand-600 text-white text-xs flex items-center justify-center font-bold">
              A
            </span>
            ATS
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-slate-600 hover:text-slate-900">
                {l.label}
              </Link>
            ))}
            {user.role === "ADMIN" && (
              <Link href="/admin/users" className="text-slate-600 hover:text-slate-900">
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-500">
            {user.name} <span className="badge bg-slate-100 text-slate-600 ml-1">{user.role}</span>
          </span>
          <form action={logoutAction}>
            <button className="btn-secondary" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
