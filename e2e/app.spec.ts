import { expect, test } from '@playwright/test';

test('renders the Saituno tuner and visual baseline', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Saituno/);
  await expect(page.getByRole('heading', { name: /Stimm dein Instrument/i })).toBeVisible();
  await expect(page.getByTestId('tuner-panel')).toBeVisible();
  await expect(page.request.get('/worklets/yin-processor.js')).resolves.toBeTruthy();
  await expect(page.getByTestId('no-pitch')).toBeVisible();
  await expect(page.getByTestId('tuner-toggle')).toContainText('Mikrofon aktivieren');
  await expect(page.getByTestId('auto-mode')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('string-E2')).toBeVisible();
  await expect(page).toHaveScreenshot('saituno-tuner-interface.png', { animations: 'disabled' });
});

test('allows switching between automatic and manual string selection', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('manual-mode').click();
  await expect(page.getByTestId('manual-mode')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('string-E2')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('string-A2').click();
  await expect(page.getByTestId('string-A2')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('tuner-status')).toContainText('Aktiviere das Mikrofon');
  await page.getByTestId('auto-mode').click();
  await expect(page.getByTestId('auto-mode')).toHaveAttribute('aria-pressed', 'true');
});

test('shows a helpful message when microphone permission is denied', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true,
      value: async () => { throw new DOMException('Denied', 'NotAllowedError'); }
    });
  });
  await page.goto('/');
  await page.getByTestId('tuner-toggle').click();
  await expect(page.getByRole('status')).toContainText('Mikrofonzugriff wurde verweigert');
});
