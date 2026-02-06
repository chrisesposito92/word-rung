const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function fromDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

export function addDays(dateKey: string, days: number): string {
  const date = fromDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
}

export function diffDays(fromDateKeyValue: string, toDateKeyValue: string): number {
  const from = fromDateKey(fromDateKeyValue).getTime();
  const to = fromDateKey(toDateKeyValue).getTime();
  return Math.round((to - from) / DAY_MS);
}

export function formatDateLong(dateKey: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(fromDateKey(dateKey));
}

export function seedFromDateKey(dateKey: string): number {
  const digitsOnly = Number(dateKey.replace(/-/g, ''));
  return Number.isFinite(digitsOnly) ? digitsOnly : Date.now();
}
