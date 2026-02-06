import { NextRequest, NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/admin/guard';
import { listScheduledPuzzlesPage } from '@/lib/data/repository';

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parsePositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const requestedDate = searchParams.get('fromDate');
  const fromDate = requestedDate && DATE_KEY_PATTERN.test(requestedDate) ? requestedDate : undefined;
  const page = parsePositiveInteger(searchParams.get('page'), 1);
  const pageSize = parsePositiveInteger(searchParams.get('pageSize'), 20);

  const result = await listScheduledPuzzlesPage({
    fromDate,
    page,
    pageSize,
  });

  return NextResponse.json(result);
}
