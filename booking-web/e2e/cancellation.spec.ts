import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { bookingDates } from './helpers/date';

test('pembatalan reservasi mengubah status dan membatalkan booking', async ({ page, request }) => {
  const dates = bookingDates(test.info().retry);
  await loginAs(page, request, 'peminjam');
  await page.goto('./peminjam/pinjam/baru');
  await page.getByRole('button', { name: '1 ruang, banyak tanggal' }).click();
  await page.getByLabel('Ruang').click();
  await page.getByRole('option', { name: /F104/ }).click();
  await page.getByPlaceholder('Nama kegiatan / tujuan').fill('Batal Test');
  await page.getByLabel('Nama ketua pelaksana').fill('Budi');
  await page.getByLabel('NIM/NIP/NIDN').fill('21040120140001');
  await page.getByLabel('Nomor HP').fill('081234567890');
  // Satu slot default sudah cukup; isi tanggal langsung.
  await page.getByLabel('Tanggal').nth(0).fill(dates.d);
  await page.getByRole('button', { name: 'Simpan Reservasi' }).click();

  await expect(page).toHaveURL(/\/peminjam\/pinjam\/\d+\/proposal$/);
  await expect(page.getByRole('heading', { name: 'Proposal Kegiatan' })).toBeVisible();

  await page.getByRole('link', { name: 'Lihat detail' }).click();
  await expect(page).toHaveURL(/\/peminjam\/pinjam\/\d+\/?$/);
  await expect(page.getByRole('heading', { name: 'Batal Test' })).toBeVisible();
  await expect(page.getByText('Draft', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Batalkan' }).click();
  await page.getByLabel('Alasan (opsional)').fill('Jadwal berubah');
  await page.getByRole('button', { name: 'Ya, batalkan' }).click();
  await expect(page.getByText('Dibatalkan', { exact: true })).toBeVisible();
});
