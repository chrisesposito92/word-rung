import { describe, expect, it } from 'vitest';

import { resolveGameTheme, toggleGameTheme } from '@/lib/client/theme';

describe('theme helpers', () => {
  it('defaults to dark for unknown values', () => {
    expect(resolveGameTheme(undefined)).toBe('dark');
    expect(resolveGameTheme(null)).toBe('dark');
    expect(resolveGameTheme('system')).toBe('dark');
  });

  it('keeps explicit dark and light values', () => {
    expect(resolveGameTheme('dark')).toBe('dark');
    expect(resolveGameTheme('light')).toBe('light');
  });

  it('toggles theme values', () => {
    expect(toggleGameTheme('dark')).toBe('light');
    expect(toggleGameTheme('light')).toBe('dark');
  });
});
