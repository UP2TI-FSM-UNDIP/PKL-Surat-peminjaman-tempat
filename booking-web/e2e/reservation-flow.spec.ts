import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

test.describe('reservasi multi-slot', () => {
  test.beforeEach(async ({ page, request }) => {
    await loginAs(page, request, 'peminjam');
  });

  test('membuat satu ruang banyak tanggal lalu masuk step proposal', async ({ page }) => {
    await page.goto('./peminjam/pinjam/baru');
    await page.getByRole('button', { name: '1 ruang, banyak tanggal' }).click();
    await page.getByLabel('Ruang').click();
    await page.getByRole('option', { name: /F104/ }).click();
    await page.getByPlaceholder('Nama kegiatan / tujuan').fill('Rapat Panitia');
    await page.getByLabel('Nama ketua pelaksana').fill('Budi');
    await page.getByLabel('NIM/NIP/NIDN').fill('21040120140001');
    await page.getByLabel('Nomor HP').fill('081234567890');
    await page.getByRole('button', { name: 'Tambah tanggal' }).click();
    const dates = page.getByLabel('Tanggal');
    await dates.nth(0).fill('2026-12-01');
    await dates.nth(1).fill('2026-12-02');
    await page.getByRole('button', { name: 'Simpan Reservasi' }).click();
    await expect(page).toHaveURL(/\/peminjam\/pinjam\/\d+\/proposal$/);
  });

  test('menampilkan Buka Sekat hanya untuk ruang bersebelahan', async ({ page }) => {
    await page.goto('./peminjam/pinjam/baru');
    await page.getByRole('button', { name: '1 tanggal, banyak ruang' }).click();
    await page.getByLabel('Tanggal').fill('2026-12-01');
    await page.getByRole('button', { name: 'Tambah ruang' }).click();
    await page.getByLabel('Ruang').nth(0).click();
    await page.getByRole('option', { name: /F104/ }).click();
    await page.getByLabel('Ruang').nth(1).click();
    await page.getByRole('option', { name: /F107/ }).click();
    await expect(page.getByLabel('Buka Sekat')).toBeVisible();
  });
});
