import { describe, expect, it } from 'vitest';

import type { PublicLadder } from '@/lib/game/types';
import { evaluateLadderAttempt } from '@/lib/game/validator';

const ladder: PublicLadder = {
  id: 'L1',
  start: 'cold',
  end: 'warm',
  par: 4,
  maxMoves: 8,
};

describe('evaluateLadderAttempt', () => {
  it('returns solved for a valid chain', () => {
    const result = evaluateLadderAttempt(ladder, ['cord', 'card', 'ward']);

    expect(result.status).toBe('solved');
    expect(result.movesUsed).toBe(4);
  });

  it('returns incomplete when the chain is not connected to the end word yet', () => {
    const result = evaluateLadderAttempt(ladder, ['cord']);

    expect(result.status).toBe('incomplete');
  });

  it('rejects dictionary misses', () => {
    const result = evaluateLadderAttempt(ladder, ['zzzz']);

    expect(result.status).toBe('invalid');
    expect(result.message).toContain('not in the dictionary');
  });

  it('rejects gaps between entries', () => {
    const result = evaluateLadderAttempt(ladder, ['cord', '', 'card']);

    expect(result.status).toBe('invalid');
    expect(result.message).toContain('no gaps');
  });
});
