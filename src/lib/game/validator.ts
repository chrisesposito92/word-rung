import { normalizeWord, WORD_DICTIONARY } from '@/lib/game/dictionary';
import { differsByOneLetter } from '@/lib/game/graph';
import { WORD_LENGTH, type Ladder, type LadderEvaluation, type PublicLadder } from '@/lib/game/types';

type LadderLike = Ladder | PublicLadder;

export function evaluateLadderAttempt(ladder: LadderLike, rawEntries: string[]): LadderEvaluation {
  const words: string[] = [];
  let hitGap = false;

  for (const rawEntry of rawEntries) {
    const entry = normalizeWord(rawEntry);
    if (!entry) {
      hitGap = true;
      continue;
    }

    if (hitGap) {
      return {
        status: 'invalid',
        message: 'Fill in words from top to bottom with no gaps.',
        movesUsed: 0,
        words,
      };
    }

    if (!/^[a-z]+$/.test(entry) || entry.length !== WORD_LENGTH) {
      return {
        status: 'invalid',
        message: `"${entry}" must be exactly ${WORD_LENGTH} letters.`,
        movesUsed: words.length,
        words,
      };
    }

    if (!WORD_DICTIONARY.has(entry)) {
      return {
        status: 'invalid',
        message: `"${entry}" is not in the dictionary.`,
        movesUsed: words.length,
        words,
      };
    }

    words.push(entry);
  }

  const movesUsed = words.length + 1;
  if (movesUsed > ladder.maxMoves) {
    return {
      status: 'invalid',
      message: `This ladder allows at most ${ladder.maxMoves} moves.`,
      movesUsed,
      words,
    };
  }

  const visited = new Set<string>([ladder.start]);
  let current = ladder.start;

  for (const word of words) {
    if (visited.has(word)) {
      return {
        status: 'invalid',
        message: 'You cannot reuse words in the same ladder.',
        movesUsed,
        words,
      };
    }

    if (!differsByOneLetter(current, word)) {
      return {
        status: 'invalid',
        message: `"${word}" must differ from "${current}" by one letter.`,
        movesUsed,
        words,
      };
    }

    visited.add(word);
    current = word;
  }

  if (visited.has(ladder.end)) {
    return {
      status: 'invalid',
      message: 'The target word can only appear at the end.',
      movesUsed,
      words,
    };
  }

  if (!differsByOneLetter(current, ladder.end)) {
    return {
      status: 'incomplete',
      message: 'Not connected yet. Add another bridge word.',
      movesUsed,
      words,
    };
  }

  return {
    status: 'solved',
    message: 'Solved!',
    movesUsed,
    words,
  };
}

export function isValidSolutionPath(ladder: Ladder): boolean {
  if (ladder.solution.length !== ladder.par + 1) {
    return false;
  }

  if (ladder.solution[0] !== ladder.start || ladder.solution.at(-1) !== ladder.end) {
    return false;
  }

  const usedWords = new Set<string>();
  for (let i = 0; i < ladder.solution.length; i += 1) {
    const word = ladder.solution[i];
    if (!WORD_DICTIONARY.has(word) || usedWords.has(word)) {
      return false;
    }
    usedWords.add(word);

    if (i > 0 && !differsByOneLetter(ladder.solution[i - 1], word)) {
      return false;
    }
  }

  return true;
}
