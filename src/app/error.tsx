'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-slate-100">
      <section className="rounded-2xl border border-rose-500/70 bg-rose-500/10 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-rose-200">Application error</p>
        <h1 className="mt-2 text-2xl font-semibold">Something went wrong.</h1>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-md border border-rose-200/70 px-3 py-1.5 text-sm text-rose-100"
        >
          Retry
        </button>
      </section>
    </main>
  );
}
