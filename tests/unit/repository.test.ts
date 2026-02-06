import { describe, expect, it } from 'vitest';

import { isHiddenLeaderboardDisplayName } from '@/lib/data/repository';

describe('isHiddenLeaderboardDisplayName', () => {
  it('hides Playwright test identities from leaderboard output', () => {
    expect(isHiddenLeaderboardDisplayName('Playwright Ace')).toBe(true);
    expect(isHiddenLeaderboardDisplayName('PlaywrightRunner')).toBe(true);
    expect(isHiddenLeaderboardDisplayName('playwright-runner')).toBe(true);
  });

  it('keeps normal player names visible', () => {
    expect(isHiddenLeaderboardDisplayName('Guest')).toBe(false);
    expect(isHiddenLeaderboardDisplayName('Word Wizard')).toBe(false);
  });
});
