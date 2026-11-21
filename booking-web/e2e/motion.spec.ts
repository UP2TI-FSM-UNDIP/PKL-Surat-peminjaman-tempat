import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

test('logo FSM menjadi link beranda', async ({ page, request }) => {
  await loginAs(page, request, 'peminjam');

  await page.goto('peminjam/reservasi');

  const logo = page.getByRole('link', { name: 'Beranda' });
  await expect(logo).toHaveAttribute('href', '/peminjaman-ruang/');

  await logo.click();
  await expect(page).toHaveURL(/\/peminjaman-ruang\/peminjam\/?$/);
});

test('segmented control menggeser indikator dan mengubah filter', async ({
  page,
  request,
}) => {
  await loginAs(page, request, 'admin');

  await page.goto('admin/rooms');

  const group = page.getByRole('group', { name: 'Filter status ruangan' });
  const indicator = group.locator('span[aria-hidden="true"]');
  const before = await indicator.evaluate(
    (element) => getComputedStyle(element).transform,
  );

  const activeButton = group.getByRole('button', {
    name: 'Aktif',
    exact: true,
  });
  await activeButton.click();

  await expect(activeButton).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(350);

  const after = await indicator.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  expect(after).not.toBe(before);
});

test('checkbox menampilkan animasi check-pop', async ({ page, request }) => {
  await loginAs(page, request, 'admin');

  await page.goto('admin/rooms');
  await page.getByRole('button', { name: 'Tambah Ruang' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const checkbox = dialog.locator('#is-bookable-weekday');
  await checkbox.click();

  await expect(checkbox).toHaveAttribute('data-state', 'checked');
  await expect(
    checkbox.locator('[data-slot="checkbox-indicator"]'),
  ).toHaveCSS('animation-name', 'check-pop');
});

test('landing memakai marker dan roll link', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('dev_login_opt_out', '1');
  });

  await page.goto('./');

  await expect(page.locator('.marker-highlight')).toHaveText('Peminjaman');
  await expect(page.locator('.roll-link')).toHaveCount(1);
});
