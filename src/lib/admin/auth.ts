import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_COOKIE_NAME = 'word_rung_admin';

const TOKEN_PAYLOAD = 'word-rung-admin-session';

function resolveAdminPasscode(): string {
  return process.env.ADMIN_PASSCODE || 'codex-admin';
}

function signToken(passcode: string): string {
  return createHmac('sha256', passcode).update(TOKEN_PAYLOAD).digest('hex');
}

export function createAdminSessionToken(): string {
  return `v1.${signToken(resolveAdminPasscode())}`;
}

export function verifyAdminPasscode(inputPasscode: string): boolean {
  return inputPasscode === resolveAdminPasscode();
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token || !token.startsWith('v1.')) {
    return false;
  }

  const expected = Buffer.from(createAdminSessionToken());
  const actual = Buffer.from(token);

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}
