import { expect, test } from '@playwright/test';

test('renders the Saituno tuner and visual baseline', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Saituno/);
  await expect(page.getByRole('heading', { name: /Stimm dein Instrument/i })).toBeVisible();
  await expect(page.getByTestId('tuner-panel')).toBeVisible();
  expect(await page.request.get('/worklets/yin-processor.js')).toBeOK();
  await expect(page.getByTestId('no-pitch')).toBeVisible();
  await expect(page.getByTestId('tuner-toggle')).toContainText('Mikrofon aktivieren');
  await expect(page.getByTestId('auto-mode')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('instrument-select')).toHaveValue('guitar');
  await expect(page.getByTestId('tuning-select')).toHaveValue('guitar-standard');
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

test('switches instruments and exposes their tuning presets', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('instrument-select').selectOption('ukulele');
  await expect(page.getByTestId('tuning-select')).toHaveValue('ukulele-high-g');
  await expect(page.getByTestId('string-G4')).toBeVisible();
  await page.getByTestId('tuning-select').selectOption('ukulele-low-g');
  await expect(page.getByTestId('string-G3')).toBeVisible();

  await page.getByTestId('instrument-select').selectOption('bass');
  await expect(page.getByTestId('tuning-select')).toHaveValue('bass-4-standard');
  await page.getByTestId('tuning-select').selectOption('bass-6-standard');
  await expect(page.getByTestId('string-B0')).toBeVisible();
  await expect(page.getByTestId('string-C3')).toBeVisible();
  await expect(page.getByTestId('tuning-select').locator('option')).toHaveCount(5);

  await page.getByTestId('instrument-select').selectOption('guitar');
  await page.getByTestId('tuning-select').selectOption('guitar-drop-d');
  await expect(page.getByTestId('tuning-select')).toHaveValue('guitar-drop-d');
  await expect(page.getByTestId('string-D2')).toBeVisible();
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
