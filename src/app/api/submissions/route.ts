import { NextResponse } from 'next/server';

import { getDailyLeaderboard, getPlayerStats, submitDailySubmission } from '@/lib/data/repository';
import { SubmissionPayloadSchema } from '@/lib/game/types';

export async function POST(request: Request) {
  try {
    const parsedPayload = SubmissionPayloadSchema.parse(await request.json());

    await submitDailySubmission(parsedPayload);

    const [leaderboard, stats] = await Promise.all([
      getDailyLeaderboard(parsedPayload.puzzleDate, 20),
      getPlayerStats(parsedPayload.participantKey),
    ]);

    return NextResponse.json({
      ok: true,
      leaderboard,
      stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit score.';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
