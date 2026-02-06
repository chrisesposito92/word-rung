'use client';

import { useCallback, useEffect, useState } from 'react';

import { toDateKey } from '@/lib/game/date';
import type { DailyPuzzle } from '@/lib/game/types';

type AdminSessionResponse = {
  authenticated: boolean;
};

type PuzzleListResponse = {
  puzzles: DailyPuzzle[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  lastScheduledDate: string | null;
};

type StatusTone = 'neutral' | 'success' | 'error';

type StatusBanner = {
  tone: StatusTone;
  text: string;
};

function statusClass(tone: StatusTone): string {
  if (tone === 'success') {
    return 'border-emerald-400/60 bg-emerald-500/10 text-emerald-100';
  }

  if (tone === 'error') {
    return 'border-rose-400/60 bg-rose-500/10 text-rose-100';
  }

  return 'border-slate-600 bg-slate-900 text-slate-200';
}

export function AdminClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [passcode, setPasscode] = useState('');

  const [statusBanner, setStatusBanner] = useState<StatusBanner | null>(null);
  const [puzzles, setPuzzles] = useState<DailyPuzzle[]>([]);
  const [isLoadingPuzzles, setIsLoadingPuzzles] = useState(false);
  const [listError, setListError] = useState('');

  const [startDate, setStartDate] = useState(toDateKey());
  const [count, setCount] = useState(3);
  const [overwrite, setOverwrite] = useState(false);

  const [browseFromDate, setBrowseFromDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [lastScheduledDate, setLastScheduledDate] = useState<string | null>(null);

  const [dateEdits, setDateEdits] = useState<Record<string, string>>({});

  const fetchSession = useCallback(async () => {
    setCheckingSession(true);
    const response = await fetch('/api/admin/session');
    const data = (await response.json()) as AdminSessionResponse;
    setIsAuthenticated(Boolean(data.authenticated));
    setCheckingSession(false);
  }, []);

  const fetchPuzzles = useCallback(async () => {
    setIsLoadingPuzzles(true);
    setListError('');

    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (browseFromDate) {
        params.set('fromDate', browseFromDate);
      }

      const response = await fetch(`/api/admin/puzzles?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Unable to load scheduled puzzles.');
      }

      const data = (await response.json()) as PuzzleListResponse;

      setPuzzles(data.puzzles ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setLastScheduledDate(data.lastScheduledDate ?? null);

      if ((data.page ?? 1) !== page) {
        setPage(data.page ?? 1);
      }

      if ((data.pageSize ?? 20) !== pageSize) {
        setPageSize(data.pageSize ?? 20);
      }

      setDateEdits(Object.fromEntries((data.puzzles ?? []).map((puzzle) => [puzzle.id, puzzle.puzzleDate])));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load scheduled puzzles.';
      setListError(message);
    } finally {
      setIsLoadingPuzzles(false);
    }
  }, [browseFromDate, page, pageSize]);

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    void fetchPuzzles();
  }, [fetchPuzzles, isAuthenticated]);

  async function handleLogin() {
    setStatusBanner(null);

    const response = await fetch('/api/admin/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ passcode }),
    });

    if (!response.ok) {
      setStatusBanner({
        tone: 'error',
        text: 'Invalid passcode.',
      });
      return;
    }

    setPasscode('');
    setIsAuthenticated(true);
    await fetchPuzzles();
  }

  async function handleLogout() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    setIsAuthenticated(false);
    setStatusBanner({
      tone: 'neutral',
      text: 'Signed out.',
    });
  }

  async function handleGenerate() {
    setStatusBanner({
      tone: 'neutral',
      text: 'Generating puzzles...',
    });

    const response = await fetch('/api/admin/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        count,
        overwrite,
      }),
    });

    const data = (await response.json()) as {
      ok?: boolean;
      error?: string;
      created?: number;
      skipped?: number;
    };

    if (!response.ok || !data.ok) {
      setStatusBanner({
        tone: 'error',
        text: data.error ?? 'Failed to generate puzzles.',
      });
      return;
    }

    setStatusBanner({
      tone: 'success',
      text: `Generated ${data.created ?? 0} puzzle(s). Skipped ${data.skipped ?? 0}.`,
    });

    await fetchPuzzles();
  }

  async function handleReassign(puzzleId: string) {
    const newDate = dateEdits[puzzleId];
    if (!newDate) {
      return;
    }

    setStatusBanner({
      tone: 'neutral',
      text: 'Updating puzzle date...',
    });

    const response = await fetch('/api/admin/reassign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ puzzleId, newDate }),
    });

    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setStatusBanner({
        tone: 'error',
        text: data.error ?? 'Unable to update puzzle date.',
      });
      return;
    }

    setStatusBanner({
      tone: 'success',
      text: 'Puzzle date updated.',
    });

    await fetchPuzzles();
  }

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = total === 0 ? 0 : rangeStart + puzzles.length - 1;

  if (checkingSession) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 text-slate-100">
        <p className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">Checking admin session...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-md px-4 py-10 text-slate-100">
        <section className="rounded-2xl border border-slate-700 bg-slate-900/75 p-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">Word Rung Admin</p>
          <h1 className="mt-2 text-2xl font-semibold">Sign in</h1>
          <label htmlFor="admin-passcode" className="mt-4 block text-sm text-slate-200">
            Passcode
          </label>
          <input
            id="admin-passcode"
            type="password"
            value={passcode}
            onChange={(event) => setPasscode(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300/70"
          />
          <button
            type="button"
            onClick={() => void handleLogin()}
            className="mt-4 rounded-md bg-cyan-300 px-3 py-1.5 text-sm font-semibold text-slate-950"
          >
            Unlock admin
          </button>
          {statusBanner ? <p className={`mt-3 rounded-md border px-3 py-2 text-sm ${statusClass(statusBanner.tone)}`}>{statusBanner.text}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 text-slate-100 md:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-700 bg-slate-900/80 p-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">Word Rung Admin</p>
          <h1 className="mt-2 text-3xl font-semibold">Puzzle Scheduler</h1>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200"
        >
          Sign out
        </button>
      </header>

      <section className="mb-6 rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">Generate daily puzzles</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm text-slate-200">
            Start date
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5"
            />
          </label>

          <label className="text-sm text-slate-200">
            Count (1-10)
            <input
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(event) => setCount(Math.max(1, Math.min(10, Number(event.target.value) || 1)))}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5"
            />
          </label>

          <label className="flex items-center gap-2 self-end rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
            <input type="checkbox" checked={overwrite} onChange={(event) => setOverwrite(event.target.checked)} />
            Overwrite existing
          </label>

          <button
            type="button"
            onClick={() => void handleGenerate()}
            className="self-end rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950"
          >
            Generate
          </button>
        </div>

        {statusBanner ? (
          <p className={`mt-4 rounded-md border px-3 py-2 text-sm ${statusClass(statusBanner.tone)}`}>
            {statusBanner.text}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">Scheduled puzzles</p>
          <button
            type="button"
            onClick={() => void fetchPuzzles()}
            className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-200"
          >
            Refresh
          </button>
        </div>

        <div className="mb-4 grid gap-3 rounded-lg border border-slate-700 bg-slate-950/70 p-3 md:grid-cols-[1fr,180px,160px,auto] md:items-end">
          <label className="text-sm text-slate-200">
            From date (optional)
            <input
              type="date"
              value={browseFromDate}
              onChange={(event) => {
                setBrowseFromDate(event.target.value);
                setPage(1);
              }}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5"
            />
          </label>

          <label className="text-sm text-slate-200">
            Page size
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={40}>40</option>
            </select>
          </label>

          <div className="text-sm text-slate-300">
            <p>
              Showing {rangeStart}-{rangeEnd} of {total}
            </p>
            <p>Last scheduled date: {lastScheduledDate ?? 'None'}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setBrowseFromDate('');
              setPage(1);
            }}
            className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200"
          >
            Clear filter
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <p className="text-sm text-slate-300">
            Page {page} of {Math.max(1, totalPages)}
          </p>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            className="rounded-md border border-slate-600 px-3 py-1 text-sm text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>

        {isLoadingPuzzles ? <p className="text-sm text-slate-400">Loading scheduled puzzles...</p> : null}
        {listError ? <p className="mb-3 rounded-md border border-rose-400/70 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{listError}</p> : null}

        {puzzles.length === 0 && !isLoadingPuzzles ? (
          <p className="rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
            No scheduled puzzles found for the current filter.
          </p>
        ) : null}

        <div className="space-y-2">
          {puzzles.map((puzzle) => (
            <article
              key={puzzle.id}
              className="grid items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-3 md:grid-cols-[1.5fr_1fr_auto]"
            >
              <div>
                <p className="text-sm font-medium text-slate-100">{puzzle.name}</p>
                <p className="text-xs text-slate-400">{puzzle.ladders.map((ladder) => `${ladder.start}→${ladder.end}`).join(' · ')}</p>
              </div>

              <input
                type="date"
                value={dateEdits[puzzle.id] ?? puzzle.puzzleDate}
                onChange={(event) =>
                  setDateEdits((previous) => ({
                    ...previous,
                    [puzzle.id]: event.target.value,
                  }))
                }
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
              />

              <button
                type="button"
                onClick={() => void handleReassign(puzzle.id)}
                className="rounded-md border border-cyan-300/70 px-3 py-1.5 text-sm text-cyan-100"
              >
                Reassign
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
