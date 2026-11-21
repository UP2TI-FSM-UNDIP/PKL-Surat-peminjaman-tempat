import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { trackPageErrors } from './helpers/page';

test('peminjam melihat daftar pengajuan dan wizard reservasi', async ({
  page,
  request,
}) => {
  const assertNoPageErrors = trackPageErrors(page);

  await loginAs(page, request, 'peminjam');

  await page.goto('./peminjam/pinjam');

  await expect(
    page.getByRole('heading', { name: 'Daftar Pengajuan' }),
  ).toBeVisible();

  for (const label of [
    'Semua',
    'Draft',
    'Diajukan',
    'Disetujui',
    'Ditolak',
    'Kedaluwarsa',
    'Dibatalkan',
  ]) {
    await expect(
      page.getByRole('button', { name: label, exact: true }),
    ).toBeVisible();
  }

  const createButton = page.getByRole('button', { name: 'Buat Reservasi' });
  await expect(createButton).toBeVisible();
  await createButton.click();

  await expect(page).toHaveURL(/\/peminjam\/pinjam\/baru$/);
  await expect(
    page.getByRole('heading', { name: 'Reservasi Ruang' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: '1 ruang, banyak tanggal' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: '1 tanggal, banyak ruang' }),
  ).toBeVisible();

  assertNoPageErrors();
});
