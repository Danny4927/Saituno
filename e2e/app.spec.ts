import { expect, test } from '@playwright/test';

test('loads the Saituno landing page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Saituno/);
  await expect(page.getByRole('heading', { name: /Klingt nach deinem Ton/i })).toBeVisible();
  await expect(page.getByText('Das Stimmgerät entsteht gerade.')).toBeVisible();
  await expect(page).toHaveScreenshot('saituno-home.png', {
    animations: 'disabled'
  });
});
