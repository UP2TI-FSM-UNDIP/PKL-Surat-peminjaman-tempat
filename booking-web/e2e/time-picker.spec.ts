import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

test('wheel picker memilih jam dan menit', async ({ page, request }) => {
  await loginAs(page, request, 'peminjam');

  await page.goto('peminjam/reservasi');

  const startTime = page.getByRole('button', { name: 'Mulai', exact: true });
  await expect(startTime).toBeVisible({ timeout: 15_000 });
  await startTime.click();

  const hours = page.getByRole('listbox', { name: 'Jam' });
  await hours.getByRole('option', { name: '10', exact: true }).click();

  const minutes = page.getByRole('listbox', { name: 'Menit' });
  await minutes.getByRole('option', { name: '30', exact: true }).click();

  await page.getByRole('dialog').getByRole('button', { name: 'Terapkan' }).click();

  await expect(startTime).toContainText('10:30');
});
