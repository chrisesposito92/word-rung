import type { LadderRunSummary, LadderScoreBreakdown, PuzzleScoreSummary } from '@/lib/game/types';

const BASE_POINTS_PER_LADDER = 300;
const MOVE_PENALTY = 40;
const HINT_PENALTY = 35;
const MAX_TIME_PENALTY = 80;
const MIN_POINTS_ON_SOLVE = 50;

export function scoreLadder(run: LadderRunSummary): LadderScoreBreakdown {
  if (!run.solved) {
    return {
      ladderId: run.ladderId,
      solved: false,
      basePoints: BASE_POINTS_PER_LADDER,
      movePenalty: 0,
      hintPenalty: 0,
      timePenalty: 0,
      finalPoints: 0,
    };
  }

  const movesOverPar = Math.max(0, run.movesUsed - run.par);
  const movePenalty = movesOverPar * MOVE_PENALTY;
  const hintPenalty = run.hintsUsed * HINT_PENALTY;
  const timePenalty = Math.min(MAX_TIME_PENALTY, Math.floor(run.seconds / 12));

  const finalPoints = Math.max(
    MIN_POINTS_ON_SOLVE,
    BASE_POINTS_PER_LADDER - movePenalty - hintPenalty - timePenalty,
  );

  return {
    ladderId: run.ladderId,
    solved: true,
    basePoints: BASE_POINTS_PER_LADDER,
    movePenalty,
    hintPenalty,
    timePenalty,
    finalPoints,
  };
}

export function scorePuzzle(runs: LadderRunSummary[], totalSeconds: number): PuzzleScoreSummary {
  const ladders = runs.map(scoreLadder);
  const usedHints = runs.reduce((sum, run) => sum + run.hintsUsed, 0);
  const movesOverPar = runs.reduce((sum, run) => sum + Math.max(0, run.movesUsed - run.par), 0);
  const laddersSolved = runs.filter((run) => run.solved).length;

  const allSolved = laddersSolved === runs.length;
  const solvedAtPar = runs.every((run) => run.solved && run.movesUsed === run.par);
  const flawlessBonus = allSolved && usedHints === 0 ? (solvedAtPar ? 120 : 60) : 0;

  const ladderTotal = ladders.reduce((sum, ladder) => sum + ladder.finalPoints, 0);

  return {
    totalScore: ladderTotal + flawlessBonus,
    totalSeconds,
    usedHints,
    movesOverPar,
    laddersSolved,
    flawlessBonus,
    ladders,
  };
}
