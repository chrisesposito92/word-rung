import { NextResponse } from 'next/server';

import { getDailyLeaderboard } from '@/lib/data/repository';
import { toDateKey } from '@/lib/game/date';

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedDate = searchParams.get('date') ?? toDateKey();
  const dateKey = DATE_KEY_PATTERN.test(requestedDate) ? requestedDate : toDateKey();

  const leaderboard = await getDailyLeaderboard(dateKey, 20);

  return NextResponse.json({
    dateKey,
    leaderboard,
  });
}
