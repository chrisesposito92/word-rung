import { expect, test } from '@playwright/test';

test('admin can generate and reassign puzzles', async ({ page }) => {
  await page.goto('/admin');

  await page.getByLabel('Passcode').fill('codex-admin');
  await page.getByRole('button', { name: 'Unlock admin' }).click();

  await expect(page.getByRole('heading', { name: 'Puzzle Scheduler' })).toBeVisible();

  await page.getByLabel('Count (1-10)').fill('2');
  await page.getByRole('button', { name: 'Generate' }).click();

  const firstRow = page.locator('article').first();
  await expect(firstRow).toBeVisible();

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await firstRow.locator('input[type="date"]').fill(tomorrow);
  await firstRow.getByRole('button', { name: 'Reassign' }).click();
  const hasTomorrowDate = await page.locator('article input[type="date"]').evaluateAll((nodes, dateValue) => {
    return nodes.some((node) => (node as HTMLInputElement).value === dateValue);
  }, tomorrow);

  expect(hasTomorrowDate).toBeTruthy();
});
