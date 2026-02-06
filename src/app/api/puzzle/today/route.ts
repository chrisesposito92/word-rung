import { NextResponse } from 'next/server';

import { toDateKey } from '@/lib/game/date';
import { sanitizePuzzleForClient } from '@/lib/game/generator';
import { getDailyPuzzle, isUsingLocalData } from '@/lib/data/repository';

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedDate = searchParams.get('date') ?? toDateKey();
  const dateKey = DATE_KEY_PATTERN.test(requestedDate) ? requestedDate : toDateKey();

  const includeSolution =
    searchParams.get('includeSolution') === '1' &&
    (process.env.NODE_ENV === 'test' || process.env.ALLOW_DEBUG_PUZZLE === 'true');

  const puzzle = await getDailyPuzzle(dateKey);

  return NextResponse.json({
    puzzle: sanitizePuzzleForClient(puzzle, { includeSolution }),
    localMode: isUsingLocalData(),
  });
}
