import { expect, test } from '@playwright/test';

test('solves the daily puzzle and posts to leaderboard', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Word Rung' })).toBeVisible();

  const themeToggle = page.getByRole('button', { name: 'Toggle light and dark mode' });
  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.getByLabel('Display name').fill('Playwright Ace');

  for (const ladderId of ['L1', 'L2', 'L3']) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      await page.getByTestId(`${ladderId}-check`).click();

      const solvedText = page.getByTestId(`ladder-${ladderId}`).getByText(/Solved/);
      if (await solvedText.isVisible()) {
        break;
      }

      await page.getByTestId(`${ladderId}-hint`).click();
      await page.getByTestId(`${ladderId}-check`).click();

      if (await solvedText.isVisible()) {
        break;
      }

      if (attempt === 7) {
        throw new Error(`Ladder ${ladderId} did not solve after hint attempts.`);
      }
    }
  }

  await expect(page.getByText(/^Score \d+/)).toBeVisible();
  await expect(page.getByText('Score submitted to the leaderboard.')).toBeVisible();
  await expect(page.getByText('Playwright Ace')).toBeVisible();
});
