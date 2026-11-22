import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { bookingDates } from './helpers/date';

test('dosen menyelesaikan reservasi dan proposal dengan NIP 18 digit', async ({ page, request }) => {
  const dates = bookingDates(test.info().retry);

  await loginAs(page, request, 'dosen');
  await page.goto('./peminjam/pinjam/baru');
  await page.getByRole('button', { name: '1 ruang, banyak tanggal' }).click();
  await page.getByLabel('Ruang').click();
  await page.getByRole('option', { name: /F104/ }).click();
  await page.getByPlaceholder('Nama kegiatan / tujuan').fill('Dosen Test');
  await page.getByLabel('Nama ketua pelaksana').fill('Dr. Dosen');
  await page.getByLabel('NIM/NIP/NIDN').fill('198001012005011001');
  await page.getByLabel('Nomor HP').fill('081234567890');
  await page.getByLabel('Tanggal').nth(0).fill(dates.h);
  await page.getByRole('button', { name: 'Simpan Reservasi' }).click();

  await expect(page).toHaveURL(/\/peminjam\/pinjam\/\d+\/proposal$/);
  await page.getByLabel('Nama kegiatan', { exact: true }).fill('Dosen Test');
  await page.getByLabel('Sifat kegiatan', { exact: true }).fill('Seminar');
  await page.getByLabel('Bentuk kegiatan', { exact: true }).fill('Offline');
  await page.getByLabel('Tujuan', { exact: true }).fill('Belajar');
  await page.getByLabel('Manfaat', { exact: true }).fill('Ilmu');
  await page.getByLabel('Sasaran peserta', { exact: true }).fill('Mahasiswa');
  await page.locator('#proposal').setInputFiles({
    name: 'proposal.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 test'),
  });
  await page.getByRole('button', { name: 'Simpan draf' }).click();
  await expect(page.getByText('Proposal PDF tersimpan')).toBeVisible();
  await page.getByRole('button', { name: 'Lanjut ke ringkasan' }).click();
  await expect(page).toHaveURL(/\/ringkasan$/);
  await page.getByRole('button', { name: 'Ajukan Peminjaman' }).click();
  await page.getByRole('button', { name: 'Ya, ajukan' }).click();
  await expect(page).toHaveURL(/\/peminjam\/pinjam\/\d+$/);
  await expect(page.getByText('Diproses', { exact: true })).toBeVisible();
});
