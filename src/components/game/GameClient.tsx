'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AuthPanel } from '@/components/game/AuthPanel';
import { LadderCard, type LadderProgress } from '@/components/game/LadderCard';
import { LeaderboardPanel } from '@/components/game/LeaderboardPanel';
import { getOrCreateGuestPlayerKey, getStoredDisplayName, storeDisplayName } from '@/lib/client/player';
import { resolveGameTheme, THEME_STORAGE_KEY, toggleGameTheme, type GameTheme } from '@/lib/client/theme';
import { formatDateLong } from '@/lib/game/date';
import { buildShareText } from '@/lib/game/share';
import { scorePuzzle } from '@/lib/game/scoring';
import { findHintWord } from '@/lib/game/solver';
import { PublicPuzzleSchema, type LeaderboardEntry, type PlayerStats, type PublicPuzzle } from '@/lib/game/types';
import { evaluateLadderAttempt } from '@/lib/game/validator';

type Identity = {
  userId?: string;
  email?: string;
};

function initializeProgress(puzzle: PublicPuzzle): Record<string, LadderProgress> {
  return Object.fromEntries(
    puzzle.ladders.map((ladder) => [
      ladder.id,
      {
        entries: Array.from({ length: Math.max(1, ladder.par - 1) }, () => ''),
        solved: false,
        status: 'idle',
        message: 'Build a path by changing one letter at a time.',
        hintsUsed: 0,
        movesUsed: 0,
      } satisfies LadderProgress,
    ]),
  );
}

function formatSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function sanitizeWordInput(value: string): string {
  return value.replace(/[^a-z]/gi, '').slice(0, 4).toLowerCase();
}

function defaultDisplayName(email?: string): string {
  if (email) {
    return email.split('@')[0].slice(0, 32);
  }
  return 'Guest';
}

export function GameClient() {
  const [puzzle, setPuzzle] = useState<PublicPuzzle | null>(null);
  const [localMode, setLocalMode] = useState(false);
  const [progressByLadder, setProgressByLadder] = useState<Record<string, LadderProgress>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [displayName, setDisplayName] = useState('Guest');
  const [identity, setIdentity] = useState<Identity>({});
  const [participantKey, setParticipantKey] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [scoreSummary, setScoreSummary] = useState<ReturnType<typeof scorePuzzle> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<GameTheme>('dark');
  const [hasHydratedTheme, setHasHydratedTheme] = useState(false);
  const hasSubmittedRef = useRef(false);

  const todayLabel = useMemo(() => (puzzle ? formatDateLong(puzzle.puzzleDate) : ''), [puzzle]);
  const solvedLadders = useMemo(() => {
    if (!puzzle) {
      return 0;
    }

    return puzzle.ladders.filter((ladder) => progressByLadder[ladder.id]?.solved).length;
  }, [progressByLadder, puzzle]);
  const allSolved = puzzle ? solvedLadders === puzzle.ladders.length : false;

  const fetchLeaderboard = useCallback(async (dateKey: string) => {
    const response = await fetch(`/api/leaderboard?date=${dateKey}`);
    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { leaderboard?: LeaderboardEntry[] };
    setLeaderboard(data.leaderboard ?? []);
  }, []);

  const loadPuzzle = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/puzzle/today');
      if (!response.ok) {
        throw new Error('Unable to load today\'s puzzle.');
      }

      const data = (await response.json()) as { puzzle: unknown; localMode: boolean };
      const parsedPuzzle = PublicPuzzleSchema.parse(data.puzzle);

      setPuzzle(parsedPuzzle);
      setLocalMode(Boolean(data.localMode));
      setProgressByLadder(initializeProgress(parsedPuzzle));
      setScoreSummary(null);
      setElapsedSeconds(0);
      setStartedAt(null);
      setSubmissionMessage('');
      hasSubmittedRef.current = false;

      await fetchLeaderboard(parsedPuzzle.puzzleDate);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load puzzle.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchLeaderboard]);

  useEffect(() => {
    const guestKey = getOrCreateGuestPlayerKey();
    const storedName = getStoredDisplayName();
    setParticipantKey(guestKey);
    setDisplayName(storedName || 'Guest');
    void loadPuzzle();
  }, [loadPuzzle]);

  useEffect(() => {
    if (!startedAt || scoreSummary) {
      return;
    }

    const timerId = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [startedAt, scoreSummary]);

  useEffect(() => {
    storeDisplayName(displayName.trim());
  }, [displayName]);

  useEffect(() => {
    const root = document.documentElement;
    const rootTheme = resolveGameTheme(root.dataset.theme);

    let initialTheme = rootTheme;
    try {
      initialTheme = resolveGameTheme(window.localStorage.getItem(THEME_STORAGE_KEY) ?? rootTheme);
    } catch {
      initialTheme = rootTheme;
    }

    root.dataset.theme = initialTheme;
    setTheme(initialTheme);
    setHasHydratedTheme(true);
  }, []);

  useEffect(() => {
    if (!hasHydratedTheme) {
      return;
    }

    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors for locked-down browser sessions.
    }
  }, [hasHydratedTheme, theme]);

  useEffect(() => {
    if (!participantKey) {
      return;
    }

    void (async () => {
      const resolvedParticipantKey = identity.userId ?? participantKey;
      const response = await fetch(`/api/stats?participantKey=${encodeURIComponent(resolvedParticipantKey)}`);
      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { stats?: PlayerStats };
      if (data.stats) {
        setPlayerStats(data.stats);
      }
    })();
  }, [identity.userId, participantKey]);

  const markStarted = useCallback(() => {
    setStartedAt((previous) => previous ?? Date.now());
  }, []);

  const updateEntry = useCallback((ladderId: string, index: number, value: string) => {
    markStarted();
    setProgressByLadder((previous) => {
      const ladderProgress = previous[ladderId];
      if (!ladderProgress) {
        return previous;
      }

      const entries = [...ladderProgress.entries];
      entries[index] = sanitizeWordInput(value);

      return {
        ...previous,
        [ladderId]: {
          ...ladderProgress,
          entries,
          status: ladderProgress.solved ? 'solved' : 'idle',
          message: ladderProgress.solved ? ladderProgress.message : 'Ready to check.',
        },
      };
    });
  }, [markStarted]);

  const addStep = useCallback((ladderId: string) => {
    setProgressByLadder((previous) => {
      const ladderProgress = previous[ladderId];
      if (!ladderProgress) {
        return previous;
      }

      return {
        ...previous,
        [ladderId]: {
          ...ladderProgress,
          entries: [...ladderProgress.entries, ''],
        },
      };
    });
  }, []);

  const removeStep = useCallback((ladderId: string) => {
    setProgressByLadder((previous) => {
      const ladderProgress = previous[ladderId];
      if (!ladderProgress || ladderProgress.entries.length <= 1) {
        return previous;
      }

      return {
        ...previous,
        [ladderId]: {
          ...ladderProgress,
          entries: ladderProgress.entries.slice(0, -1),
        },
      };
    });
  }, []);

  const checkLadder = useCallback((ladderId: string) => {
    if (!puzzle) {
      return;
    }

    markStarted();
    const ladder = puzzle.ladders.find((item) => item.id === ladderId);
    if (!ladder) {
      return;
    }

    setProgressByLadder((previous) => {
      const ladderProgress = previous[ladderId];
      if (!ladderProgress) {
        return previous;
      }

      const evaluation = evaluateLadderAttempt(ladder, ladderProgress.entries);
      const solvedAtSeconds =
        evaluation.status === 'solved' && !ladderProgress.solved
          ? Math.max(0, Math.floor((Date.now() - (startedAt ?? Date.now())) / 1000))
          : ladderProgress.solvedAtSeconds;

      const solvedMessage =
        evaluation.status === 'solved'
          ? evaluation.movesUsed === ladder.par
            ? `Solved at par (${ladder.par})!`
            : `Solved in ${evaluation.movesUsed} moves.`
          : evaluation.message;

      return {
        ...previous,
        [ladderId]: {
          ...ladderProgress,
          solved: evaluation.status === 'solved',
          status: evaluation.status,
          message: solvedMessage,
          movesUsed: evaluation.status === 'solved' ? evaluation.movesUsed : ladderProgress.movesUsed,
          solvedAtSeconds,
        },
      };
    });
  }, [markStarted, puzzle, startedAt]);

  const applyHint = useCallback((ladderId: string) => {
    if (!puzzle) {
      return;
    }

    markStarted();
    const ladder = puzzle.ladders.find((item) => item.id === ladderId);
    if (!ladder) {
      return;
    }

    setProgressByLadder((previous) => {
      const ladderProgress = previous[ladderId];
      if (!ladderProgress || ladderProgress.solved) {
        return previous;
      }

      const hint = findHintWord(ladder, ladderProgress.entries);
      if (!hint) {
        return {
          ...previous,
          [ladderId]: {
            ...ladderProgress,
            status: 'incomplete',
            message: 'No hint available. Keep building your chain.',
          },
        };
      }

      const entries = [...ladderProgress.entries];
      while (entries.length <= hint.index) {
        entries.push('');
      }

      entries[hint.index] = hint.word;

      return {
        ...previous,
        [ladderId]: {
          ...ladderProgress,
          entries,
          hintsUsed: ladderProgress.hintsUsed + 1,
          status: 'incomplete',
          message: `Hint revealed step ${hint.index + 1}: ${hint.word.toUpperCase()}.`,
        },
      };
    });
  }, [markStarted, puzzle]);

  const finalizePuzzle = useCallback(async () => {
    if (!puzzle || scoreSummary || hasSubmittedRef.current) {
      return;
    }

    hasSubmittedRef.current = true;
    const totalSeconds = elapsedSeconds;
    const runs = puzzle.ladders.map((ladder) => {
      const progress = progressByLadder[ladder.id];
      return {
        ladderId: ladder.id,
        solved: Boolean(progress?.solved),
        movesUsed: progress?.movesUsed || ladder.maxMoves,
        par: ladder.par,
        hintsUsed: progress?.hintsUsed || 0,
        seconds: progress?.solvedAtSeconds ?? totalSeconds,
      };
    });

    const summary = scorePuzzle(runs, totalSeconds);
    setScoreSummary(summary);

    if (summary.laddersSolved < puzzle.ladders.length) {
      setProgressByLadder((previous) => {
        const updated = { ...previous };
        for (const ladder of puzzle.ladders) {
          const ladderProgress = updated[ladder.id];
          if (!ladderProgress || ladderProgress.solved) {
            continue;
          }

          updated[ladder.id] = {
            ...ladderProgress,
            status: 'incomplete',
            message: 'Run ended before this ladder was solved.',
          };
        }
        return updated;
      });
    }

    const completionPrefix =
      summary.laddersSolved === puzzle.ladders.length
        ? 'All ladders solved.'
        : `Run ended with ${summary.laddersSolved}/${puzzle.ladders.length} ladders solved.`;

    const resolvedParticipantKey = (identity.userId ?? participantKey) || 'guest';
    const resolvedDisplayName = displayName.trim() || defaultDisplayName(identity.email);

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          puzzleDate: puzzle.puzzleDate,
          participantKey: resolvedParticipantKey,
          userId: identity.userId,
          displayName: resolvedDisplayName,
          totalScore: summary.totalScore,
          totalSeconds: summary.totalSeconds,
          laddersSolved: summary.laddersSolved,
          usedHints: summary.usedHints,
          movesOverPar: summary.movesOverPar,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        leaderboard?: LeaderboardEntry[];
        stats?: PlayerStats;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? 'Unable to submit score.');
      }

      setLeaderboard(data.leaderboard ?? []);
      setPlayerStats(data.stats ?? null);
      setSubmissionMessage(`${completionPrefix} Score submitted to the leaderboard.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit score.';
      setSubmissionMessage(`${completionPrefix} ${message}`);
    }
  }, [displayName, elapsedSeconds, identity.email, identity.userId, participantKey, progressByLadder, puzzle, scoreSummary]);

  useEffect(() => {
    if (!allSolved || !puzzle || scoreSummary || hasSubmittedRef.current) {
      return;
    }

    void finalizePuzzle();
  }, [allSolved, finalizePuzzle, puzzle, scoreSummary]);

  const handleFinishNow = useCallback(() => {
    if (!puzzle || scoreSummary || hasSubmittedRef.current || !startedAt) {
      return;
    }

    if (!allSolved) {
      const shouldFinish = window.confirm('Finish this run now? Any unsolved ladders will score 0 points.');
      if (!shouldFinish) {
        return;
      }
    }

    void finalizePuzzle();
  }, [allSolved, finalizePuzzle, puzzle, scoreSummary, startedAt]);

  const shareText = useMemo(() => {
    if (!puzzle || !scoreSummary) {
      return '';
    }

    return buildShareText(puzzle.puzzleDate, scoreSummary);
  }, [puzzle, scoreSummary]);

  const handleShare = useCallback(async () => {
    if (!shareText) {
      return;
    }

    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }, [shareText]);

  const handleThemeToggle = useCallback(() => {
    setTheme((previous) => toggleGameTheme(previous));
  }, []);

  if (isLoading) {
    return (
      <main className="game-shell mx-auto max-w-6xl px-4 py-10 text-[var(--wr-text-primary)]">
        <p className="rounded-xl border border-[var(--wr-border)] bg-[var(--wr-surface)] p-4">Loading today&apos;s puzzle...</p>
      </main>
    );
  }

  if (errorMessage || !puzzle) {
    return (
      <main className="game-shell mx-auto max-w-6xl px-4 py-10 text-[var(--wr-text-primary)]">
        <div className="rounded-xl border border-[var(--wr-danger)] bg-[var(--wr-danger-soft)] p-4">
          <p>{errorMessage || 'Unable to load puzzle.'}</p>
          <button
            type="button"
            onClick={() => void loadPuzzle()}
            className="mt-3 rounded-md border border-[var(--wr-danger)] px-3 py-1 text-sm text-[var(--wr-danger)] transition hover:opacity-80"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="game-shell mx-auto max-w-6xl px-4 py-8 text-[var(--wr-text-primary)] md:px-6">
      <header
        className="mb-8 rounded-3xl border border-[var(--wr-border)] p-6"
        style={{
          background: 'var(--wr-hero-bg)',
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--wr-accent)]">Daily Word Puzzle</p>
          <button
            type="button"
            onClick={handleThemeToggle}
            aria-label="Toggle light and dark mode"
            className="rounded-md border border-[var(--wr-border)] bg-[var(--wr-surface-soft)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--wr-text-secondary)] transition hover:border-[var(--wr-accent)] hover:text-[var(--wr-accent)]"
          >
            {hasHydratedTheme ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : 'Theme'}
          </button>
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-[var(--wr-text-heading)] md:text-5xl">Word Rung</h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--wr-text-secondary)]">
          Build three word ladders. Change one letter per move, stay in the dictionary, and finish near par for a higher
          score.
        </p>
        <div className="mt-5 flex flex-wrap gap-5 text-sm text-[var(--wr-text-secondary)]">
          <span className="font-mono uppercase tracking-[0.2em] text-[var(--wr-text-muted)]">{todayLabel}</span>
          <span className="font-mono uppercase tracking-[0.2em] text-[var(--wr-text-muted)]">
            Time {formatSeconds(elapsedSeconds)}
          </span>
          {localMode ? (
            <span className="rounded-md border border-[var(--wr-warning)] bg-[var(--wr-warning-soft)] px-2 py-0.5 text-xs text-[var(--wr-warning)]">
              Local mode
            </span>
          ) : null}
        </div>
      </header>

      <section className="mb-6 grid gap-4 rounded-2xl border border-[var(--wr-border)] bg-[var(--wr-surface-soft)] p-4 md:grid-cols-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--wr-text-muted)]">Rule 1</p>
          <p className="mt-1 text-sm text-[var(--wr-text-primary)]">Each move changes exactly one letter.</p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--wr-text-muted)]">Rule 2</p>
          <p className="mt-1 text-sm text-[var(--wr-text-primary)]">Every bridge must be a valid 4-letter word.</p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--wr-text-muted)]">Rule 3</p>
          <p className="mt-1 text-sm text-[var(--wr-text-primary)]">Solve as many ladders as you can, then finish and submit.</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          {!scoreSummary ? (
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--wr-border)] bg-[var(--wr-surface)] p-4">
              <p className="text-sm text-[var(--wr-text-primary)]">
                Progress: <span className="font-mono text-[var(--wr-accent)]">{solvedLadders}</span> / {puzzle.ladders.length}{' '}
                solved
              </p>
              <button
                type="button"
                onClick={handleFinishNow}
                disabled={!startedAt}
                className="rounded-md border border-[var(--wr-accent)] px-3 py-1.5 text-sm text-[var(--wr-accent)] transition hover:border-[var(--wr-accent-strong)] hover:text-[var(--wr-accent-strong)] disabled:cursor-not-allowed disabled:border-[var(--wr-border-soft)] disabled:text-[var(--wr-text-faint)]"
              >
                {allSolved ? 'Submit score' : 'Finish run now'}
              </button>
            </section>
          ) : null}

          {puzzle.ladders.map((ladder) => {
            const progress = progressByLadder[ladder.id];
            if (!progress) {
              return null;
            }

            return (
              <LadderCard
                key={ladder.id}
                ladder={ladder}
                progress={progress}
                disabled={Boolean(scoreSummary)}
                onEntryChange={(index, value) => updateEntry(ladder.id, index, value)}
                onAddStep={() => addStep(ladder.id)}
                onRemoveStep={() => removeStep(ladder.id)}
                onCheck={() => checkLadder(ladder.id)}
                onHint={() => applyHint(ladder.id)}
              />
            );
          })}

          {scoreSummary ? (
            <section className="rounded-2xl border border-[var(--wr-success)] bg-[var(--wr-success-soft)] p-5">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--wr-success)]">
                {scoreSummary.laddersSolved === puzzle.ladders.length ? 'Completed' : 'Run complete'}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--wr-success)]">Score {scoreSummary.totalScore}</h2>
              <p className="mt-2 text-sm text-[var(--wr-text-primary)]">
                Time {formatSeconds(scoreSummary.totalSeconds)} | Hints {scoreSummary.usedHints} | Moves over par{' '}
                {scoreSummary.movesOverPar}
              </p>
              <p className="mt-1 text-sm text-[var(--wr-text-primary)]">
                Ladders solved: {scoreSummary.laddersSolved} / {puzzle.ladders.length}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="rounded-md border border-[var(--wr-success)] px-3 py-1 text-sm text-[var(--wr-success)] transition hover:opacity-80"
                >
                  {copied ? 'Copied!' : 'Copy result'}
                </button>
                <button
                  type="button"
                  onClick={() => void loadPuzzle()}
                  className="rounded-md border border-[var(--wr-border)] px-3 py-1 text-sm text-[var(--wr-text-primary)] transition hover:border-[var(--wr-text-muted)]"
                >
                  Reload puzzle
                </button>
              </div>
              {submissionMessage ? <p className="mt-3 text-xs text-[var(--wr-text-secondary)]">{submissionMessage}</p> : null}
            </section>
          ) : null}
        </section>

        <div className="space-y-4">
          <AuthPanel
            displayName={displayName}
            localMode={localMode}
            onDisplayNameChange={setDisplayName}
            onIdentityChange={setIdentity}
          />
          <LeaderboardPanel dateKey={puzzle.puzzleDate} entries={leaderboard} stats={playerStats} />
        </div>
      </div>
    </main>
  );
}
