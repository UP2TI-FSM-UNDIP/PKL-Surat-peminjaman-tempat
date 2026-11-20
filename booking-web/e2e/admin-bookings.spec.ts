import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { trackPageErrors } from './helpers/page';

test('admin melihat halaman peminjaman dan filter status', async ({
  page,
  request,
}) => {
  const assertNoPageErrors = trackPageErrors(page);

  await loginAs(page, request, 'admin');

  await page.goto('admin/peminjaman');

  await expect(
    page.getByRole('heading', { name: 'Daftar Peminjaman Ruangan' }),
  ).toBeVisible();
  await expect(page.getByPlaceholder('Cari peminjaman...')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Semua Status' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pending' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Approved' })).toBeVisible();

  await expect(page.getByText('Belum ada data peminjaman')).toBeVisible();

  assertNoPageErrors();
});
