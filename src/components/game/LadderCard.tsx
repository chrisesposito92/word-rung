'use client';

import clsx from 'clsx';

import type { PublicLadder } from '@/lib/game/types';

export type LadderProgress = {
  entries: string[];
  solved: boolean;
  status: 'idle' | 'solved' | 'invalid' | 'incomplete';
  message: string;
  hintsUsed: number;
  movesUsed: number;
  solvedAtSeconds?: number;
};

type LadderCardProps = {
  ladder: PublicLadder;
  progress: LadderProgress;
  disabled?: boolean;
  onEntryChange: (index: number, value: string) => void;
  onAddStep: () => void;
  onRemoveStep: () => void;
  onCheck: () => void;
  onHint: () => void;
};

function statusClass(status: LadderProgress['status']): string {
  switch (status) {
    case 'solved':
      return 'border-[var(--wr-success)] bg-[var(--wr-success-soft)] text-[var(--wr-success)]';
    case 'invalid':
      return 'border-[var(--wr-danger)] bg-[var(--wr-danger-soft)] text-[var(--wr-danger)]';
    case 'incomplete':
      return 'border-[var(--wr-warning)] bg-[var(--wr-warning-soft)] text-[var(--wr-warning)]';
    default:
      return 'border-[var(--wr-border)] bg-[var(--wr-surface-soft)] text-[var(--wr-text-secondary)]';
  }
}

function formatWord(word: string): string {
  return word.toUpperCase();
}

export function LadderCard({
  ladder,
  progress,
  disabled,
  onEntryChange,
  onAddStep,
  onRemoveStep,
  onCheck,
  onHint,
}: LadderCardProps) {
  const maxIntermediates = ladder.maxMoves - 1;
  const canAddStep = progress.entries.length < maxIntermediates;
  const canRemoveStep = progress.entries.length > 1;

  return (
    <section
      data-testid={`ladder-${ladder.id}`}
      className="rounded-2xl border border-[var(--wr-border)] bg-[var(--wr-surface)] p-5 shadow-[0_10px_40px_-24px_rgba(15,23,42,0.85)]"
    >
      <header className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--wr-text-muted)]">{ladder.id}</p>
          <h3 className="text-xl font-semibold text-[var(--wr-text-heading)]">
            {formatWord(ladder.start)} → {formatWord(ladder.end)}
          </h3>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--wr-text-muted)]">Par {ladder.par}</p>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--wr-text-faint)]">Max {ladder.maxMoves}</p>
        </div>
      </header>

      <div className="mb-4 grid gap-2">
        <div className="rounded-lg border border-[var(--wr-border)] bg-[var(--wr-surface-strong)] px-3 py-2 font-mono text-lg tracking-[0.18em] text-[var(--wr-word-start)]">
          {formatWord(ladder.start)}
        </div>

        {progress.entries.map((entry, index) => (
          <input
            key={`${ladder.id}-${index}`}
            value={entry.toUpperCase()}
            onChange={(event) => onEntryChange(index, event.target.value)}
            maxLength={4}
            autoComplete="off"
            spellCheck={false}
            disabled={disabled || progress.solved}
            className="rounded-lg border border-[var(--wr-border)] bg-[var(--wr-surface-strong)] px-3 py-2 font-mono text-lg tracking-[0.18em] text-[var(--wr-text-primary)] outline-none transition focus:border-[var(--wr-accent)] disabled:opacity-70"
            aria-label={`${ladder.id} step ${index + 1}`}
          />
        ))}

        <div className="rounded-lg border border-[var(--wr-border)] bg-[var(--wr-surface-strong)] px-3 py-2 font-mono text-lg tracking-[0.18em] text-[var(--wr-word-end)]">
          {formatWord(ladder.end)}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAddStep}
          disabled={disabled || progress.solved || !canAddStep}
          className="rounded-md border border-[var(--wr-border)] px-3 py-1 text-sm text-[var(--wr-text-primary)] transition hover:border-[var(--wr-text-muted)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          + Step
        </button>
        <button
          type="button"
          onClick={onRemoveStep}
          disabled={disabled || progress.solved || !canRemoveStep}
          className="rounded-md border border-[var(--wr-border)] px-3 py-1 text-sm text-[var(--wr-text-primary)] transition hover:border-[var(--wr-text-muted)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          - Step
        </button>
        <button
          type="button"
          onClick={onHint}
          disabled={disabled || progress.solved}
          data-testid={`${ladder.id}-hint`}
          className="rounded-md border border-[var(--wr-accent)] px-3 py-1 text-sm text-[var(--wr-accent)] transition hover:border-[var(--wr-accent-strong)] hover:text-[var(--wr-accent-strong)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Hint
        </button>
        <button
          type="button"
          onClick={onCheck}
          disabled={disabled || progress.solved}
          data-testid={`${ladder.id}-check`}
          className="rounded-md bg-[var(--wr-accent)] px-3 py-1 text-sm font-semibold text-[var(--wr-accent-contrast)] transition hover:bg-[var(--wr-accent-strong)] disabled:cursor-not-allowed disabled:bg-[var(--wr-border-soft)] disabled:text-[var(--wr-text-faint)]"
        >
          Check
        </button>
      </div>

      <div className={clsx('rounded-lg border px-3 py-2 text-sm', statusClass(progress.status))}>
        <p>{progress.message || 'Build a path by changing one letter each move.'}</p>
        <p className="mt-1 font-mono text-xs uppercase tracking-[0.2em] text-[var(--wr-text-muted)]">
          Moves used: {progress.movesUsed || progress.entries.filter(Boolean).length + 1} | Hints: {progress.hintsUsed}
        </p>
      </div>
    </section>
  );
}
