import { addDays, seedFromDateKey } from '@/lib/game/date';
import { WORD_DICTIONARY } from '@/lib/game/dictionary';
import { buildWordGraph, distancesFrom, shortestPath } from '@/lib/game/graph';
import { createSeededRandom } from '@/lib/game/random';
import {
  DailyPuzzleSchema,
  EXTRA_MOVE_ALLOWANCE,
  type DailyPuzzle,
  type Ladder,
  type PublicPuzzle,
} from '@/lib/game/types';
import { FOUR_LETTER_WORDS } from '@/lib/game/word-list';

const ALL_WORDS = [...FOUR_LETTER_WORDS];
const WORD_GRAPH = buildWordGraph(ALL_WORDS);

const DEFAULT_PAR_TARGETS = [3, 4, 5] as const;

const NAME_ADJECTIVES = [
  'Clever',
  'Bright',
  'Swift',
  'Sharp',
  'Nimble',
  'Bold',
  'Neat',
  'Tricky',
] as const;

const NAME_NOUNS = ['Rungs', 'Bridges', 'Ladders', 'Jumps', 'Links', 'Threads'] as const;

function createPuzzleName(seed: number): string {
  const adjective = NAME_ADJECTIVES[seed % NAME_ADJECTIVES.length];
  const noun = NAME_NOUNS[Math.floor(seed / 7) % NAME_NOUNS.length];
  const numberTag = String(seed).slice(-3);
  return `${adjective} ${noun} #${numberTag}`;
}

type LadderGenerationOptions = {
  index: number;
  minPar: number;
  maxPar: number;
  blockedWords: Set<string>;
  seed: number;
};

function generateLadder(options: LadderGenerationOptions): Ladder {
  const { index, minPar, maxPar, blockedWords, seed } = options;
  const random = createSeededRandom(seed);
  const attemptLimit = 360;
  const maxDepth = maxPar + 2;

  for (let attempt = 0; attempt < attemptLimit; attempt += 1) {
    const start = random.pick(ALL_WORDS);
    if (blockedWords.has(start)) {
      continue;
    }

    const distances = distancesFrom(WORD_GRAPH, start, maxDepth);
    const candidates = random.shuffle(
      [...distances.entries()]
        .filter(([candidate, distance]) => {
          if (candidate === start) {
            return false;
          }
          if (blockedWords.has(candidate)) {
            return false;
          }
          return distance >= minPar && distance <= maxPar;
        })
        .map(([candidate]) => candidate),
    );

    for (const end of candidates.slice(0, 16)) {
      const path = shortestPath(WORD_GRAPH, start, end, maxDepth);
      if (!path) {
        continue;
      }

      const par = path.length - 1;
      if (par < minPar || par > maxPar) {
        continue;
      }

      if (path.some((word) => blockedWords.has(word) || !WORD_DICTIONARY.has(word))) {
        continue;
      }

      return {
        id: `L${index + 1}`,
        start,
        end,
        par,
        maxMoves: par + EXTRA_MOVE_ALLOWANCE,
        solution: path,
      };
    }
  }

  throw new Error(`Unable to generate ladder ${index + 1}.`);
}

export function generateDailyPuzzle(dateKey: string, seedOffset = 0): DailyPuzzle {
  const seed = seedFromDateKey(dateKey) + seedOffset * 97;
  const blockedWords = new Set<string>();

  const ladders = DEFAULT_PAR_TARGETS.map((targetPar, index) => {
    const ladder = generateLadder({
      index,
      minPar: targetPar,
      maxPar: targetPar + 1,
      blockedWords,
      seed: seed + index * 7919,
    });

    for (const word of ladder.solution) {
      blockedWords.add(word);
    }

    return ladder;
  });

  const puzzle: DailyPuzzle = {
    id: `puzzle-${dateKey}`,
    puzzleDate: dateKey,
    name: createPuzzleName(seed),
    seed,
    createdAt: new Date(`${dateKey}T00:00:00.000Z`).toISOString(),
    ladders,
  };

  return DailyPuzzleSchema.parse(puzzle);
}

export function generatePuzzleBatch(startDate: string, count: number): DailyPuzzle[] {
  if (count < 1 || count > 10) {
    throw new Error('Puzzle batch size must be between 1 and 10.');
  }

  return Array.from({ length: count }, (_, index) => {
    const dateKey = addDays(startDate, index);
    return generateDailyPuzzle(dateKey, index);
  });
}

export function sanitizePuzzleForClient(
  puzzle: DailyPuzzle,
  options?: { includeSolution?: boolean },
): PublicPuzzle | DailyPuzzle {
  if (options?.includeSolution) {
    return puzzle;
  }

  return {
    ...puzzle,
    ladders: puzzle.ladders.map((ladder) => ({
      id: ladder.id,
      start: ladder.start,
      end: ladder.end,
      par: ladder.par,
      maxMoves: ladder.maxMoves,
    })),
  };
}
