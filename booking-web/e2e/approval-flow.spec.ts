import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

test('rantai SPV → TU → Wadek2 menyetujui pengajuan', async ({ page, request }) => {
  await loginAs(page, request, 'peminjam');
  await page.goto('./peminjam/pinjam/baru');
  await page.getByRole('button', { name: '1 ruang, banyak tanggal' }).click();
  await page.getByLabel('Ruang').click();
  await page.getByRole('option', { name: /F104/ }).click();
  await page.getByPlaceholder('Nama kegiatan / tujuan').fill('Approval Test');
  await page.getByLabel('Nama ketua pelaksana').fill('Budi');
  await page.getByLabel('NIM/NIP/NIDN').fill('21040120140001');
  await page.getByLabel('Nomor HP').fill('081234567890');
  // Satu slot default sudah cukup; isi tanggal langsung.
  await page.getByLabel('Tanggal').nth(0).fill('2026-12-05');
  await page.getByRole('button', { name: 'Simpan Reservasi' }).click();

  await expect(page).toHaveURL(/\/peminjam\/pinjam\/\d+\/proposal$/);
  await expect(page.getByRole('heading', { name: 'Proposal Kegiatan' })).toBeVisible();

  await page.getByLabel('Nama kegiatan', { exact: true }).fill('Approval Test');
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

  for (const role of ['spv-sumberdaya', 'manajer-tata-usaha', 'wadek2'] as const) {
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await loginAs(page, request, role);
    await page.goto(`./${role}`);

    const row = page.getByRole('row').filter({ hasText: 'Approval Test' });
    await expect(row.getByRole('button', { name: 'Tinjau' })).toBeVisible();
    await row.getByRole('button', { name: 'Tinjau' }).click();
    await expect(page.getByRole('heading', { name: 'Approval Test' })).toBeVisible();

    await page.getByRole('button', { name: 'Setujui' }).click();
    await page.getByRole('button', { name: 'Ya, setujui' }).click();
    await expect(page).toHaveURL(new RegExp(`/${role}/?$`), { timeout: 15_000 });
  }

  await loginAs(page, request, 'peminjam');
  await page.goto('./peminjam/pinjam');
  await expect(page.getByText('Disetujui').first()).toBeVisible();
});
