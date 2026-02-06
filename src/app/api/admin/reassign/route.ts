import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { isAdminRequest } from '@/lib/admin/guard';
import { reassignPuzzleDate } from '@/lib/data/repository';

const payloadSchema = z.object({
  puzzleId: z.string().min(1),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const payload = payloadSchema.parse(await request.json());
    await reassignPuzzleDate(payload.puzzleId, payload.newDate);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reassign puzzle date.';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
