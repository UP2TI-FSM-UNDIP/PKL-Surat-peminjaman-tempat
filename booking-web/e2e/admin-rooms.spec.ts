import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { trackPageErrors } from './helpers/page';

test('admin dapat mencari ruangan seed', async ({ page, request }) => {
  const assertNoPageErrors = trackPageErrors(page);

  await loginAs(page, request, 'admin');

  await page.goto('./admin/rooms');

  await expect(
    page.getByRole('heading', { name: 'Manajemen Ruang' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Semua Status' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Aktif', exact: true }),
  ).toBeVisible();

  const search = page.getByPlaceholder('Cari ruangan...');
  await expect(search).toBeVisible();
  await search.fill('A101');

  await expect(
    page.getByRole('cell', { name: 'A101', exact: true }),
  ).toBeVisible();

  assertNoPageErrors();
});

for (const role of ['wadek2', 'manajer-tata-usaha', 'spv-sumberdaya'] as const) {
  test(`${role} dapat membuka manajemen ruang`, async ({ page, request }) => {
    await loginAs(page, request, role);
    await page.goto('./admin/rooms');
    await expect(
      page.getByRole('heading', { name: 'Manajemen Ruang' }),
    ).toBeVisible();
  });
}

test('peminjam ditolak dari manajemen ruang admin', async ({ page, request }) => {
  await loginAs(page, request, 'peminjam');
  await page.goto('./admin/rooms');
  await expect(page).toHaveURL(/\/peminjam\/?$/);
});
