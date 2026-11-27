import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { bookingDates } from './helpers/date';

test('admin membuat manual booking yang langsung disetujui', async ({ page, request }) => {
  const dates = bookingDates(test.info().retry);
  await loginAs(page, request, 'admin');
  await page.goto('./admin/peminjaman/baru');
  await page.getByRole('button', { name: '1 ruang, banyak tanggal' }).click();
  await page.getByLabel('Ruang').click();
  await page.getByRole('option', { name: /F104/ }).click();
  await page.locator('#purpose').fill('Manual Admin');
  await page.getByLabel('Nama ketua pelaksana').fill('Admin');
  await page.getByLabel('NIM/NIP/NIDN').fill('21040120140001');
  await page.getByLabel('Nomor HP').fill('081234567890');
  // Satu slot default sudah cukup; isi tanggal langsung.
  await page.getByLabel('Tanggal').nth(0).fill(dates.f);
  await page.getByRole('button', { name: 'Buat Manual Booking' }).click();
  await expect(page).toHaveURL(/\/admin\/peminjaman(?:\?.*)?$/);
  await expect(page.getByRole('heading', { name: 'Daftar Peminjaman Ruangan' })).toBeVisible();
});
