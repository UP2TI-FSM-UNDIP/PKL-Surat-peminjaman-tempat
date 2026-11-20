import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { trackPageErrors } from './helpers/page';

test('admin dapat mencari ruangan seed', async ({ page, request }) => {
  const assertNoPageErrors = trackPageErrors(page);

  await loginAs(page, request, 'admin');

  await page.goto('admin/rooms/');

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
