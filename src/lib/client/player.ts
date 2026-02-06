const PLAYER_KEY_STORAGE_KEY = 'word-rung-player-key';
const DISPLAY_NAME_STORAGE_KEY = 'word-rung-display-name';

function createFallbackId(): string {
  return `guest-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateGuestPlayerKey(): string {
  if (typeof window === 'undefined') {
    return 'guest-server';
  }

  const existing = window.localStorage.getItem(PLAYER_KEY_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : createFallbackId();
  window.localStorage.setItem(PLAYER_KEY_STORAGE_KEY, next);
  return next;
}

export function getStoredDisplayName(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(DISPLAY_NAME_STORAGE_KEY) ?? '';
}

export function storeDisplayName(displayName: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, displayName);
}
