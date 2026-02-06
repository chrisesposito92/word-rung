import { describe, expect, it } from 'vitest';

import { scorePuzzle } from '@/lib/game/scoring';

describe('scorePuzzle', () => {
  it('awards flawless bonus when all ladders are solved at par with no hints', () => {
    const result = scorePuzzle(
      [
        { ladderId: 'L1', solved: true, movesUsed: 3, par: 3, hintsUsed: 0, seconds: 20 },
        { ladderId: 'L2', solved: true, movesUsed: 4, par: 4, hintsUsed: 0, seconds: 35 },
        { ladderId: 'L3', solved: true, movesUsed: 5, par: 5, hintsUsed: 0, seconds: 48 },
      ],
      120,
    );

    expect(result.flawlessBonus).toBe(120);
    expect(result.totalScore).toBeGreaterThan(900);
    expect(result.laddersSolved).toBe(3);
  });

  it('penalizes hints and extra moves', () => {
    const result = scorePuzzle(
      [
        { ladderId: 'L1', solved: true, movesUsed: 5, par: 3, hintsUsed: 1, seconds: 80 },
        { ladderId: 'L2', solved: true, movesUsed: 6, par: 4, hintsUsed: 2, seconds: 95 },
        { ladderId: 'L3', solved: true, movesUsed: 5, par: 5, hintsUsed: 0, seconds: 60 },
      ],
      210,
    );

    expect(result.flawlessBonus).toBe(0);
    expect(result.movesOverPar).toBe(4);
    expect(result.usedHints).toBe(3);
    expect(result.totalScore).toBeLessThan(900);
  });

  it('returns zero points for unsolved ladders', () => {
    const result = scorePuzzle(
      [
        { ladderId: 'L1', solved: false, movesUsed: 0, par: 3, hintsUsed: 0, seconds: 10 },
        { ladderId: 'L2', solved: true, movesUsed: 4, par: 4, hintsUsed: 0, seconds: 20 },
        { ladderId: 'L3', solved: false, movesUsed: 0, par: 5, hintsUsed: 0, seconds: 30 },
      ],
      60,
    );

    expect(result.laddersSolved).toBe(1);
    expect(result.ladders[0].finalPoints).toBe(0);
    expect(result.ladders[2].finalPoints).toBe(0);
  });
});
