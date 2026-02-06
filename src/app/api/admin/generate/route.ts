import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { isAdminRequest } from '@/lib/admin/guard';
import { generateAndSchedulePuzzles } from '@/lib/data/repository';

const payloadSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().int().min(1).max(10),
  overwrite: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const payload = payloadSchema.parse(await request.json());
    const result = await generateAndSchedulePuzzles(payload.startDate, payload.count, payload.overwrite);

    return NextResponse.json({
      ok: true,
      created: result.created,
      skipped: result.skipped,
      puzzles: result.puzzles,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate puzzles.';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
