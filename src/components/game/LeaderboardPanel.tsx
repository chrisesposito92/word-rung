'use client';

import type { LeaderboardEntry, PlayerStats } from '@/lib/game/types';

type LeaderboardPanelProps = {
  dateKey: string;
  entries: LeaderboardEntry[];
  stats: PlayerStats | null;
};

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function LeaderboardPanel({ dateKey, entries, stats }: LeaderboardPanelProps) {
  return (
    <aside className="space-y-4 rounded-2xl border border-[var(--wr-border)] bg-[var(--wr-surface)] p-4">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--wr-text-muted)]">Daily leaderboard</p>
        <h3 className="mt-1 text-lg font-semibold text-[var(--wr-text-heading)]">{dateKey}</h3>
      </div>

      <ol className="space-y-2">
        {entries.length === 0 ? (
          <li className="rounded-lg border border-[var(--wr-border)] bg-[var(--wr-surface-strong)] px-3 py-2 text-sm text-[var(--wr-text-muted)]">
            No scores yet. Be the first today.
          </li>
        ) : (
          entries.map((entry, index) => (
            <li
              key={entry.id}
              className="grid grid-cols-[32px,1fr,72px,62px] items-center rounded-lg border border-[var(--wr-border)] bg-[var(--wr-surface-strong)] px-3 py-2 text-sm"
            >
              <span className="font-mono text-[var(--wr-text-faint)]">{index + 1}</span>
              <span className="truncate text-[var(--wr-text-primary)]">{entry.displayName}</span>
              <span className="text-right font-mono text-[var(--wr-accent)]">{entry.totalScore}</span>
              <span className="text-right font-mono text-[var(--wr-text-muted)]">{formatDuration(entry.totalSeconds)}</span>
            </li>
          ))
        )}
      </ol>

      {stats ? (
        <div className="rounded-lg border border-[var(--wr-border)] bg-[var(--wr-surface-strong)] p-3">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--wr-text-muted)]">My stats</p>
          <div className="grid grid-cols-2 gap-2 text-sm text-[var(--wr-text-primary)]">
            <span>Completed</span>
            <span className="text-right font-mono">{stats.completedPuzzles}</span>
            <span>Average</span>
            <span className="text-right font-mono">{stats.averageScore}</span>
            <span>Best</span>
            <span className="text-right font-mono">{stats.bestScore}</span>
            <span>Streak</span>
            <span className="text-right font-mono">{stats.currentStreak}</span>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
