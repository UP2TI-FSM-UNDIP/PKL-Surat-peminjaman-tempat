import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

test('admin mengubah tier dan melihat preview', async ({ page, request }) => {
  await loginAs(page, request, 'admin');
  await page.goto('./admin/kebijakan-peminjaman');
  await expect(page.getByRole('heading', { name: 'Kebijakan Peminjaman' })).toBeVisible();
  await page.locator('#min_booking_days').fill('1');
  await page.getByLabel('Minimal hari tier 1').fill('7');
  await page.getByLabel('Offset tier 1').fill('6');
  await expect(page.getByText('H-7')).toBeVisible();
});
