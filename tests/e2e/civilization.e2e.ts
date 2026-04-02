import { expect, test } from '@playwright/test';

const MODE_HEADING = '选择文明主线策略';
const START_BUTTON = 'Enter Civilization';

test.describe('Civilization smoke flow', () => {
  test('boots into mode selection with a stable title', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/世界文明模拟器|OMNIS APIEN/);
    await expect(page.getByRole('heading', { name: MODE_HEADING })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByRole('button', { name: START_BUTTON })).toBeVisible();
  });

  test('can switch performance modes without leaving the shell', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('button', { name: START_BUTTON })).toBeVisible({
      timeout: 60_000,
    });

    const ecoOption = page.getByRole('option', { name: /ECO/ });
    await ecoOption.click();
    await expect(ecoOption).toHaveAttribute('aria-selected', 'true');

    await expect(page.locator('.mode-stage__current strong')).toContainText('低耗生存');
    await expect(page.getByRole('button', { name: START_BUTTON })).toBeVisible();
  });
});
