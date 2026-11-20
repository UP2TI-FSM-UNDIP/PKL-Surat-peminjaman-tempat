import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { trackPageErrors } from './helpers/page';

test('peminjam melihat daftar pengajuan dan form reservasi', async ({
  page,
  request,
}) => {
  const assertNoPageErrors = trackPageErrors(page);

  await loginAs(page, request, 'peminjam');

  await page.goto('peminjam/pinjam');

  await expect(
    page.getByRole('heading', { name: 'Daftar Pengajuan' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Semua', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Draft', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Diproses', exact: true }),
  ).toBeVisible();

  await page.goto('peminjam/reservasi');

  await expect(page.getByRole('combobox')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reservasi' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Muat Ulang' })).toBeVisible();

  assertNoPageErrors();
});
