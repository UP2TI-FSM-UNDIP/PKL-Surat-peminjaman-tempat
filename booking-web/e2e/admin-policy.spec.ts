import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

test('admin mengubah tier dan melihat preview', async ({ page, request }) => {
  await loginAs(page, request, 'admin');
  await page.goto('./admin/kebijakan-peminjaman');
  await expect(page.getByRole('heading', { name: 'Kebijakan Peminjaman' })).toBeVisible();
  await page.locator('#min_booking_days').fill('1');
  await page.getByLabel('Minimal hari tier 1').fill('7');
  await page.getByLabel('Offset tier 1').fill('6');
  const row = page.getByRole('row', { name: /H-7/ }).first();
  await expect(row).toBeVisible();
  await expect(row.getByRole('cell').nth(2)).toHaveText('7');
  await expect(row.getByRole('cell').nth(3)).toHaveText('6');
});
