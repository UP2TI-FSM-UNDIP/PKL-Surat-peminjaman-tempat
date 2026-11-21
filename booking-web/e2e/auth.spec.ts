import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { trackPageErrors } from './helpers/page';

test('admin dev login membuka dashboard', async ({ page, request }) => {
  const assertNoPageErrors = trackPageErrors(page);

  await loginAs(page, request, 'admin');

  await page.goto('./admin/');

  await expect(page).toHaveURL(/\/admin\/$/);
  await expect(
    page.getByRole('heading', { name: 'Dashboard' }),
  ).toBeVisible();
  await expect(page.getByText('Pending Approval', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Total Ruangan Aktif', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Total User', { exact: true })).toBeVisible();

  assertNoPageErrors();
});
