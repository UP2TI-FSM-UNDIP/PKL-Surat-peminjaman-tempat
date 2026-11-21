import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { bookingDates } from './helpers/date';

test('mengisi proposal, melihat checklist, lalu submit', async ({ page, request }) => {
  const dates = bookingDates(test.info().retry);
  await loginAs(page, request, 'peminjam');
  await page.goto('./peminjam/pinjam/baru');
  await page.getByRole('button', { name: '1 ruang, banyak tanggal' }).click();
  await page.getByLabel('Ruang').click();
  await page.getByRole('option', { name: /F104/ }).click();
  await page.getByPlaceholder('Nama kegiatan / tujuan').fill('Seminar Fase 2');
  await page.getByLabel('Nama ketua pelaksana').fill('Budi');
  await page.getByLabel('NIM/NIP/NIDN').fill('21040120140001');
  await page.getByLabel('Nomor HP').fill('081234567890');
  // Satu slot default sudah cukup; isi tanggal langsung.
  await page.getByLabel('Tanggal').nth(0).fill(dates.c);
  await page.getByRole('button', { name: 'Simpan Reservasi' }).click();

  await expect(page).toHaveURL(/\/peminjam\/pinjam\/\d+\/proposal$/);
  await expect(page.getByRole('heading', { name: 'Proposal Kegiatan' })).toBeVisible();
  await page.getByLabel('Nama kegiatan', { exact: true }).fill('Seminar Fase 2');
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
  await page.getByRole('button', { name: 'Tambah alat' }).click();
  await page.getByLabel('Nama alat').fill('Proyektor');
  await page.getByLabel('Jumlah alat').fill('2');
  await page.getByRole('button', { name: 'Simpan draf' }).click();
  await expect(page.getByText('Proposal PDF tersimpan')).toBeVisible();
  await page.getByRole('button', { name: 'Lanjut ke ringkasan' }).click();
  await expect(page).toHaveURL(/\/ringkasan$/);
});
