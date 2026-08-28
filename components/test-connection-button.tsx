"use client";

import { useState, useTransition } from "react";
import { testJobBoardConnectionAction } from "@/lib/actions/integrations-actions";
import type { JobBoardProvider } from "@/db/schema";

export default function TestConnectionButton({ provider }: { provider: JobBoardProvider }) {
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-2">
      <button
        type="button"
        className="btn-secondary text-xs"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await testJobBoardConnectionAction(provider);
            setResult(JSON.stringify(res.raw, null, 2));
          })
        }
      >
        {pending ? "Testing..." : "Test connection"}
      </button>
      {result && (
        <pre className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
}
