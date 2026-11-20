import { expect, type Page } from '@playwright/test';

/**
 * Kumpulkan pageerror dan log console error. Pageerror menggagalkan test;
 * console error hanya dicatat untuk diagnosis.
 */
export function trackPageErrors(page: Page): () => void {
  const errors: Error[] = [];

  page.on('pageerror', (error) => {
    errors.push(error);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') {
      console.error(`[browser console] ${message.text()}`);
    }
  });

  return () => {
    expect(errors, 'pageerror tidak boleh terjadi').toEqual([]);
  };
}
