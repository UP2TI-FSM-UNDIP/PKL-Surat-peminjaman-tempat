import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { trackPageErrors } from './helpers/page';

test('item sidebar aktif walau masuk lewat path berakhiran slash', async ({
  page,
  request,
}) => {
  const assertNoPageErrors = trackPageErrors(page);

  await loginAs(page, request, 'admin');

  await page.goto('admin/');

  await expect(
    page.getByRole('link', { name: 'Dashboard', exact: true }),
  ).toHaveAttribute('data-active', 'true');

  assertNoPageErrors();
});

test('user yang sudah login diarahkan dari landing ke dashboard', async ({
  page,
  request,
}) => {
  const assertNoPageErrors = trackPageErrors(page);

  await loginAs(page, request, 'admin');

  await page.goto('./');

  await expect(page).toHaveURL(/\/peminjaman-ruang\/admin\/?$/);
  await expect(
    page.getByRole('heading', { name: 'Dashboard' }),
  ).toBeVisible();

  assertNoPageErrors();
});
