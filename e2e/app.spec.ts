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

test('shows a helpful message when microphone permission is denied', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async () => {
        throw new DOMException('Denied', 'NotAllowedError');
      }
    });
  });

  await page.goto('/');
  await page.getByTestId('tuner-toggle').click();
  await expect(page.getByRole('status')).toContainText('Mikrofonzugriff wurde verweigert');
});
