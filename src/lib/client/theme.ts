export type GameTheme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'word-rung-theme';

export function resolveGameTheme(value: string | null | undefined): GameTheme {
  return value === 'light' ? 'light' : 'dark';
}

export function toggleGameTheme(theme: GameTheme): GameTheme {
  return theme === 'dark' ? 'light' : 'dark';
}
