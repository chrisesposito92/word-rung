import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_COOKIE_NAME, createAdminSessionToken, verifyAdminPasscode, verifyAdminSessionToken } from '@/lib/admin/auth';

type LoginBody = {
  passcode?: string;
};

const MAX_AGE_SECONDS = 12 * 60 * 60;

function withAdminCookie(response: NextResponse, value: string) {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return NextResponse.json({ authenticated: verifyAdminSessionToken(token) });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LoginBody;
  const passcode = body.passcode?.trim() ?? '';

  if (!verifyAdminPasscode(passcode)) {
    return NextResponse.json(
      {
        authenticated: false,
        error: 'Invalid passcode.',
      },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ authenticated: true });
  withAdminCookie(response, createAdminSessionToken());
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
