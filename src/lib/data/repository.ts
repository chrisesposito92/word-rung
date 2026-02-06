import { addDays, toDateKey } from '@/lib/game/date';
import { generateDailyPuzzle, generatePuzzleBatch } from '@/lib/game/generator';
import {
  DailyPuzzleSchema,
  SubmissionPayloadSchema,
  type DailyPuzzle,
  type LeaderboardEntry,
  type PlayerStats,
  type SubmissionPayload,
} from '@/lib/game/types';
import { createSupabaseServiceClient, isSupabaseConfigured } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types';

type PuzzleRow = {
  id: string;
  puzzle_date: string;
  name: string;
  seed: number;
  created_at: string;
  ladders: Json;
};


type SubmissionRow = {
  id: string;
  puzzle_date: string;
  participant_key: string;
  user_id: string | null;
  display_name: string;
  total_score: number;
  total_seconds: number;
  ladders_solved: number;
  used_hints: number;
  moves_over_par: number;
  created_at: string;
};

type LocalStore = {
  puzzles: Map<string, DailyPuzzle>;
  submissions: SubmissionRow[];
};

declare global {
  var __wordRungStore: LocalStore | undefined;
}

function getLocalStore(): LocalStore {
  if (!globalThis.__wordRungStore) {
    globalThis.__wordRungStore = {
      puzzles: new Map<string, DailyPuzzle>(),
      submissions: [],
    };
  }

  return globalThis.__wordRungStore;
}

function mapRowToPuzzle(row: PuzzleRow): DailyPuzzle {
  return DailyPuzzleSchema.parse({
    id: row.id,
    puzzleDate: row.puzzle_date,
    name: row.name,
    seed: row.seed,
    createdAt: row.created_at,
    ladders: row.ladders,
  });
}

function mapPuzzleToUpsertRow(puzzle: DailyPuzzle): PuzzleRow {
  return {
    id: crypto.randomUUID(),
    puzzle_date: puzzle.puzzleDate,
    name: puzzle.name,
    seed: puzzle.seed,
    created_at: puzzle.createdAt,
    ladders: puzzle.ladders,
  };
}

function compareSubmissions(a: SubmissionRow, b: SubmissionRow): number {
  if (b.total_score !== a.total_score) {
    return b.total_score - a.total_score;
  }

  if (a.total_seconds !== b.total_seconds) {
    return a.total_seconds - b.total_seconds;
  }

  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
}

function computeCurrentStreak(completedDateKeys: string[]): number {
  const completedSet = new Set(completedDateKeys);
  let streak = 0;
  let cursor = toDateKey();

  while (completedSet.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

function computePlayerStats(rows: SubmissionRow[]): PlayerStats {
  if (rows.length === 0) {
    return {
      completedPuzzles: 0,
      averageScore: 0,
      bestScore: 0,
      currentStreak: 0,
    };
  }

  const completedDates = [...new Set(rows.filter((row) => row.ladders_solved === 3).map((row) => row.puzzle_date))];
  const totalScore = rows.reduce((sum, row) => sum + row.total_score, 0);

  return {
    completedPuzzles: rows.length,
    averageScore: Math.round(totalScore / rows.length),
    bestScore: Math.max(...rows.map((row) => row.total_score)),
    currentStreak: computeCurrentStreak(completedDates),
  };
}

export async function getDailyPuzzle(dateKey: string): Promise<DailyPuzzle> {
  if (!isSupabaseConfigured()) {
    const store = getLocalStore();
    const existing = store.puzzles.get(dateKey);
    if (existing) {
      return existing;
    }

    const generated = generateDailyPuzzle(dateKey);
    store.puzzles.set(dateKey, generated);
    return generated;
  }

  const client = createSupabaseServiceClient();
  if (!client) {
    return generateDailyPuzzle(dateKey);
  }

  const { data, error } = await client
    .from('puzzles')
    .select('id,puzzle_date,name,seed,created_at,ladders')
    .eq('puzzle_date', dateKey)
    .maybeSingle<PuzzleRow>();

  if (error) {
    console.error('Failed to fetch daily puzzle:', error.message);
    return generateDailyPuzzle(dateKey);
  }

  if (!data) {
    return generateDailyPuzzle(dateKey);
  }

  return mapRowToPuzzle(data);
}

type ScheduledPuzzlePageOptions = {
  fromDate?: string;
  page: number;
  pageSize: number;
};

export type ScheduledPuzzlePage = {
  puzzles: DailyPuzzle[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  lastScheduledDate: string | null;
};

function normalizePage(page: number, totalPages: number): number {
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.min(Math.floor(page), totalPages);
}

export async function listScheduledPuzzlesPage(options: ScheduledPuzzlePageOptions): Promise<ScheduledPuzzlePage> {
  const pageSize = Math.min(100, Math.max(1, Math.floor(options.pageSize)));

  if (!isSupabaseConfigured()) {
    const store = getLocalStore();
    const allPuzzles = [...store.puzzles.values()].sort((a, b) => a.puzzleDate.localeCompare(b.puzzleDate));
    const filtered = options.fromDate
      ? allPuzzles.filter((puzzle) => puzzle.puzzleDate >= options.fromDate!)
      : allPuzzles;

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = normalizePage(options.page, totalPages);
    const offset = (page - 1) * pageSize;

    return {
      puzzles: filtered.slice(offset, offset + pageSize),
      total,
      page,
      pageSize,
      totalPages,
      lastScheduledDate: allPuzzles.at(-1)?.puzzleDate ?? null,
    };
  }

  const client = createSupabaseServiceClient();
  if (!client) {
    return {
      puzzles: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 1,
      lastScheduledDate: null,
    };
  }

  let countQuery = client.from('puzzles').select('id', { count: 'exact', head: true });
  if (options.fromDate) {
    countQuery = countQuery.gte('puzzle_date', options.fromDate);
  }

  const { count, error: countError } = await countQuery;
  if (countError) {
    console.error('Failed to count scheduled puzzles:', countError.message);
    return {
      puzzles: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 1,
      lastScheduledDate: null,
    };
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = normalizePage(options.page, totalPages);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let listQuery = client
    .from('puzzles')
    .select('id,puzzle_date,name,seed,created_at,ladders')
    .order('puzzle_date', { ascending: true });

  if (options.fromDate) {
    listQuery = listQuery.gte('puzzle_date', options.fromDate);
  }

  const { data, error } = await listQuery.range(from, to).returns<PuzzleRow[]>();
  if (error || !data) {
    if (error) {
      console.error('Failed to list scheduled puzzles:', error.message);
    }
    return {
      puzzles: [],
      total,
      page,
      pageSize,
      totalPages,
      lastScheduledDate: null,
    };
  }

  const { data: lastDateRows, error: lastDateError } = await client
    .from('puzzles')
    .select('puzzle_date')
    .order('puzzle_date', { ascending: false })
    .limit(1)
    .returns<Array<{ puzzle_date: string }>>();

  if (lastDateError) {
    console.error('Failed to fetch last scheduled date:', lastDateError.message);
  }

  return {
    puzzles: data.map(mapRowToPuzzle),
    total,
    page,
    pageSize,
    totalPages,
    lastScheduledDate: lastDateRows?.[0]?.puzzle_date ?? null,
  };
}

export async function generateAndSchedulePuzzles(
  startDate: string,
  count: number,
  overwrite = false,
): Promise<{ created: number; skipped: number; puzzles: DailyPuzzle[] }> {
  const generated = generatePuzzleBatch(startDate, count);

  if (!isSupabaseConfigured()) {
    const store = getLocalStore();
    let created = 0;
    let skipped = 0;

    for (const puzzle of generated) {
      if (store.puzzles.has(puzzle.puzzleDate) && !overwrite) {
        skipped += 1;
        continue;
      }

      store.puzzles.set(puzzle.puzzleDate, puzzle);
      created += 1;
    }

    return { created, skipped, puzzles: generated };
  }

  const client = createSupabaseServiceClient();
  if (!client) {
    return { created: 0, skipped: generated.length, puzzles: generated };
  }

  const rows = generated.map(mapPuzzleToUpsertRow);
  const { error } = await client.from('puzzles').upsert(rows, {
    onConflict: 'puzzle_date',
    ignoreDuplicates: !overwrite,
  });

  if (error) {
    throw new Error(`Unable to schedule puzzles: ${error.message}`);
  }

  return {
    created: generated.length,
    skipped: 0,
    puzzles: generated,
  };
}

export async function reassignPuzzleDate(puzzleId: string, newDate: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const store = getLocalStore();
    const sourceEntry = [...store.puzzles.entries()].find(([, puzzle]) => puzzle.id === puzzleId);
    if (!sourceEntry) {
      throw new Error('Puzzle not found.');
    }

    const [oldDate, puzzle] = sourceEntry;
    store.puzzles.delete(oldDate);
    store.puzzles.set(newDate, {
      ...puzzle,
      puzzleDate: newDate,
      id: `puzzle-${newDate}`,
    });
    return;
  }

  const client = createSupabaseServiceClient();
  if (!client) {
    throw new Error('Supabase service client unavailable.');
  }

  const { error } = await client.from('puzzles').update({ puzzle_date: newDate }).eq('id', puzzleId);
  if (error) {
    throw new Error(`Unable to reassign puzzle date: ${error.message}`);
  }
}

export async function submitDailySubmission(payloadInput: SubmissionPayload): Promise<void> {
  const payload = SubmissionPayloadSchema.parse(payloadInput);
  const createdAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const store = getLocalStore();
    const existingIndex = store.submissions.findIndex(
      (row) => row.puzzle_date === payload.puzzleDate && row.participant_key === payload.participantKey,
    );

    const nextRow: SubmissionRow = {
      id: existingIndex >= 0 ? store.submissions[existingIndex].id : crypto.randomUUID(),
      puzzle_date: payload.puzzleDate,
      participant_key: payload.participantKey,
      user_id: payload.userId ?? null,
      display_name: payload.displayName,
      total_score: payload.totalScore,
      total_seconds: payload.totalSeconds,
      ladders_solved: payload.laddersSolved,
      used_hints: payload.usedHints,
      moves_over_par: payload.movesOverPar,
      created_at: createdAt,
    };

    if (existingIndex === -1) {
      store.submissions.push(nextRow);
      return;
    }

    const existing = store.submissions[existingIndex];
    const keepCurrent =
      existing.total_score > nextRow.total_score ||
      (existing.total_score === nextRow.total_score && existing.total_seconds <= nextRow.total_seconds);

    if (!keepCurrent) {
      store.submissions[existingIndex] = nextRow;
    }
    return;
  }

  const client = createSupabaseServiceClient();
  if (!client) {
    return;
  }

  const { data: existing } = await client
    .from('submissions')
    .select('id,total_score,total_seconds')
    .eq('puzzle_date', payload.puzzleDate)
    .eq('participant_key', payload.participantKey)
    .maybeSingle<{ id: string; total_score: number; total_seconds: number }>();

  if (existing) {
    const keepCurrent =
      existing.total_score > payload.totalScore ||
      (existing.total_score === payload.totalScore && existing.total_seconds <= payload.totalSeconds);

    if (keepCurrent) {
      return;
    }
  }

  const row = {
    id: existing?.id ?? crypto.randomUUID(),
    puzzle_date: payload.puzzleDate,
    participant_key: payload.participantKey,
    user_id: payload.userId ?? null,
    display_name: payload.displayName,
    total_score: payload.totalScore,
    total_seconds: payload.totalSeconds,
    ladders_solved: payload.laddersSolved,
    used_hints: payload.usedHints,
    moves_over_par: payload.movesOverPar,
    created_at: createdAt,
  };

  const { error } = await client.from('submissions').upsert(row, {
    onConflict: 'puzzle_date,participant_key',
  });

  if (error) {
    throw new Error(`Unable to submit score: ${error.message}`);
  }
}

export async function getDailyLeaderboard(dateKey: string, limit = 20): Promise<LeaderboardEntry[]> {
  if (!isSupabaseConfigured()) {
    const store = getLocalStore();
    return store.submissions
      .filter((row) => row.puzzle_date === dateKey)
      .sort(compareSubmissions)
      .slice(0, limit)
      .map((row) => ({
        id: row.id,
        displayName: row.display_name,
        totalScore: row.total_score,
        totalSeconds: row.total_seconds,
        createdAt: row.created_at,
      }));
  }

  const client = createSupabaseServiceClient();
  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from('submissions')
    .select('id,display_name,total_score,total_seconds,created_at')
    .eq('puzzle_date', dateKey)
    .order('total_score', { ascending: false })
    .order('total_seconds', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(limit)
    .returns<Array<Pick<SubmissionRow, 'id' | 'display_name' | 'total_score' | 'total_seconds' | 'created_at'>>>();

  if (error || !data) {
    if (error) {
      console.error('Failed to fetch leaderboard:', error.message);
    }
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    displayName: row.display_name,
    totalScore: row.total_score,
    totalSeconds: row.total_seconds,
    createdAt: row.created_at,
  }));
}

export async function getPlayerStats(participantKey: string): Promise<PlayerStats> {
  if (!participantKey) {
    return {
      completedPuzzles: 0,
      averageScore: 0,
      bestScore: 0,
      currentStreak: 0,
    };
  }

  if (!isSupabaseConfigured()) {
    const store = getLocalStore();
    const rows = store.submissions.filter((row) => row.participant_key === participantKey);
    return computePlayerStats(rows);
  }

  const client = createSupabaseServiceClient();
  if (!client) {
    return {
      completedPuzzles: 0,
      averageScore: 0,
      bestScore: 0,
      currentStreak: 0,
    };
  }

  const { data, error } = await client
    .from('submissions')
    .select('puzzle_date,total_score,total_seconds,ladders_solved,participant_key,user_id,display_name,used_hints,moves_over_par,id,created_at')
    .eq('participant_key', participantKey)
    .returns<SubmissionRow[]>();

  if (error || !data) {
    if (error) {
      console.error('Failed to fetch player stats:', error.message);
    }

    return {
      completedPuzzles: 0,
      averageScore: 0,
      bestScore: 0,
      currentStreak: 0,
    };
  }

  return computePlayerStats(data);
}

export function isUsingLocalData(): boolean {
  return !isSupabaseConfigured();
}
