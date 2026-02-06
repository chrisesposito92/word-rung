import { describe, expect, it } from 'vitest';

import { generateDailyPuzzle, generatePuzzleBatch } from '@/lib/game/generator';
import { isValidSolutionPath } from '@/lib/game/validator';

describe('generateDailyPuzzle', () => {
  it('creates a valid 3-ladder puzzle for a date', () => {
    const puzzle = generateDailyPuzzle('2026-02-06');

    expect(puzzle.puzzleDate).toBe('2026-02-06');
    expect(puzzle.ladders).toHaveLength(3);

    for (const ladder of puzzle.ladders) {
      expect(ladder.id).toMatch(/^L\d$/);
      expect(ladder.maxMoves).toBeGreaterThanOrEqual(ladder.par);
      expect(isValidSolutionPath(ladder)).toBe(true);
    }
  });

  it('is deterministic for the same date', () => {
    const first = generateDailyPuzzle('2026-02-07');
    const second = generateDailyPuzzle('2026-02-07');

    expect(first).toEqual(second);
  });
});

describe('generatePuzzleBatch', () => {
  it('generates sequential puzzle dates', () => {
    const batch = generatePuzzleBatch('2026-02-06', 3);
    expect(batch.map((puzzle) => puzzle.puzzleDate)).toEqual(['2026-02-06', '2026-02-07', '2026-02-08']);
  });

  it('throws when asked for invalid puzzle counts', () => {
    expect(() => generatePuzzleBatch('2026-02-06', 0)).toThrow();
    expect(() => generatePuzzleBatch('2026-02-06', 11)).toThrow();
  });
});
