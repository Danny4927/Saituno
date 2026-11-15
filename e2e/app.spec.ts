import { expect, test } from '@playwright/test';

test('loads the Saituno audio prototype in its idle state', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Saituno/);
  await expect(page.getByRole('heading', { name: /Klingt nach deinem Ton/i })).toBeVisible();
  await expect(page.getByTestId('tuner-panel')).toBeVisible();
  await expect(page.getByTestId('no-pitch')).toBeVisible();
  await expect(page.getByTestId('tuner-toggle')).toHaveText('Mikrofon aktivieren');
  await expect(page).toHaveScreenshot('saituno-audio-prototype.png', {
    animations: 'disabled'
  });
});
