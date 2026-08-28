import { loginAction } from "@/lib/actions/auth-actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Enter both email and password.",
  invalid: "Invalid email or password.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; from?: string };
}) {
  const error = searchParams.error ? ERROR_MESSAGES[searchParams.error] : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm card p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 h-10 w-10 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
            A
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Sign in to ATS</h1>
          <p className="text-sm text-slate-500 mt-1">IT staffing requirements &amp; submissions tracker</p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <form action={loginAction} className="space-y-4">
          <input type="hidden" name="from" value={searchParams.from || "/"} />
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input className="input" id="email" name="email" type="email" required autoFocus />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input className="input" id="password" name="password" type="password" required />
          </div>
          <button type="submit" className="btn-primary w-full">
            Sign in
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-400 text-center">
          Demo accounts are listed in the project README after running the seed script.
        </p>
      </div>
    </div>
  );
}
