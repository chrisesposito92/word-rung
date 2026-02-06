import { buildWordGraph, shortestPath } from '@/lib/game/graph';
import type { Ladder, PublicLadder } from '@/lib/game/types';
import { FOUR_LETTER_WORDS } from '@/lib/game/word-list';

const SOLVER_GRAPH = buildWordGraph([...FOUR_LETTER_WORDS]);

type LadderLike = Ladder | PublicLadder;

export function solveLadder(ladder: LadderLike): string[] | null {
  return shortestPath(SOLVER_GRAPH, ladder.start, ladder.end, ladder.maxMoves);
}

export function findHintWord(
  ladder: LadderLike,
  currentEntries: string[],
): { index: number; word: string } | null {
  const solutionPath = solveLadder(ladder);
  if (!solutionPath || solutionPath.length < 3) {
    return null;
  }

  const intermediates = solutionPath.slice(1, -1);
  for (let index = 0; index < intermediates.length; index += 1) {
    const value = currentEntries[index]?.trim().toLowerCase() ?? '';
    if (value !== intermediates[index]) {
      return {
        index,
        word: intermediates[index],
      };
    }
  }

  return null;
}
