import { z } from 'zod';

export const WORD_LENGTH = 4;
export const EXTRA_MOVE_ALLOWANCE = 4;

export const LadderSchema = z.object({
  id: z.string().min(1),
  start: z.string().length(WORD_LENGTH),
  end: z.string().length(WORD_LENGTH),
  par: z.number().int().min(2).max(12),
  maxMoves: z.number().int().min(2).max(16),
  solution: z.array(z.string().length(WORD_LENGTH)).min(2),
});

export const DailyPuzzleSchema = z.object({
  id: z.string().min(1),
  puzzleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().min(1),
  seed: z.number().int().nonnegative(),
  createdAt: z.string().min(1),
  ladders: z.array(LadderSchema).length(3),
});

export const PublicLadderSchema = LadderSchema.omit({ solution: true });
export const PublicPuzzleSchema = DailyPuzzleSchema.extend({
  ladders: z.array(PublicLadderSchema).length(3),
});

export const SubmissionPayloadSchema = z.object({
  puzzleDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  displayName: z.string().trim().min(1).max(32),
  participantKey: z.string().trim().min(1).max(128),
  userId: z.string().trim().max(128).optional(),
  totalScore: z.number().int().min(0),
  totalSeconds: z.number().int().min(0),
  laddersSolved: z.number().int().min(0).max(3),
  usedHints: z.number().int().min(0),
  movesOverPar: z.number().int().min(0),
});

export type Ladder = z.infer<typeof LadderSchema>;
export type DailyPuzzle = z.infer<typeof DailyPuzzleSchema>;
export type PublicLadder = z.infer<typeof PublicLadderSchema>;
export type PublicPuzzle = z.infer<typeof PublicPuzzleSchema>;
export type SubmissionPayload = z.infer<typeof SubmissionPayloadSchema>;

export type LadderEvaluationStatus = 'solved' | 'invalid' | 'incomplete';

export type LadderEvaluation = {
  status: LadderEvaluationStatus;
  message: string;
  movesUsed: number;
  words: string[];
};

export type LadderRunSummary = {
  ladderId: string;
  solved: boolean;
  movesUsed: number;
  par: number;
  hintsUsed: number;
  seconds: number;
};

export type LadderScoreBreakdown = {
  ladderId: string;
  solved: boolean;
  basePoints: number;
  movePenalty: number;
  hintPenalty: number;
  timePenalty: number;
  finalPoints: number;
};

export type PuzzleScoreSummary = {
  totalScore: number;
  totalSeconds: number;
  usedHints: number;
  movesOverPar: number;
  laddersSolved: number;
  flawlessBonus: number;
  ladders: LadderScoreBreakdown[];
};

export type LeaderboardEntry = {
  id: string;
  displayName: string;
  totalScore: number;
  totalSeconds: number;
  createdAt: string;
};

export type PlayerStats = {
  completedPuzzles: number;
  averageScore: number;
  bestScore: number;
  currentStreak: number;
};
