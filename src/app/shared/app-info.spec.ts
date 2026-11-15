import { describe, expect, it } from 'vitest';
import { APP_NAME, APP_TAGLINE } from './app-info';

describe('application metadata', () => {
  it('uses the selected product name', () => {
    expect(APP_NAME).toBe('Saituno');
  });

  it('provides a non-empty German tagline', () => {
    expect(APP_TAGLINE.length).toBeGreaterThan(10);
  });
});
