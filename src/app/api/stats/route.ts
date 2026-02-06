import { NextResponse } from 'next/server';

import { getPlayerStats } from '@/lib/data/repository';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const participantKey = searchParams.get('participantKey')?.trim() ?? '';

  if (!participantKey) {
    return NextResponse.json(
      {
        error: 'participantKey is required.',
      },
      { status: 400 },
    );
  }

  const stats = await getPlayerStats(participantKey);
  return NextResponse.json({ stats });
}
