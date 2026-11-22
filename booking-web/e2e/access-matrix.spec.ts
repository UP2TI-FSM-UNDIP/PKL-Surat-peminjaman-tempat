import { expect, test } from '@playwright/test';
import { loginAs, loginWithoutRole, type DevRole } from './helpers/auth';

const deniedAdmin: DevRole[] = ['peminjam', 'dosen'];

for (const role of deniedAdmin) {
  test(`${role} ditolak dari halaman admin`, async ({ page, request }) => {
    await loginAs(page, request, role);
    await page.goto('./admin/rooms');
    await expect(page).toHaveURL(/\/peminjam\/?$/);
    await page.goto('./admin/kebijakan-peminjaman');
    await expect(page).toHaveURL(/\/peminjam\/?$/);
  });
}

for (const role of ['wadek2', 'manajer-tata-usaha', 'spv-sumberdaya'] as const) {
  test(`${role} hanya boleh manajemen ruang`, async ({ page, request }) => {
    await loginAs(page, request, role);
    await page.goto('./admin/rooms');
    await expect(page.getByRole('heading', { name: 'Manajemen Ruang' })).toBeVisible();
    await page.goto('./admin/kebijakan-peminjaman');
    await expect(page).not.toHaveURL(/\/admin\/kebijakan-peminjaman/);
  });
}

test('admin boleh kebijakan dan ruang', async ({ page, request }) => {
  await loginAs(page, request, 'admin');
  await page.goto('./admin/kebijakan-peminjaman');
  await expect(page.getByRole('heading', { name: 'Kebijakan Peminjaman' })).toBeVisible();
  await page.goto('./admin/rooms');
  await expect(page.getByRole('heading', { name: 'Manajemen Ruang' })).toBeVisible();
});

test('user tanpa role diarahkan ke menunggu-role', async ({ page, request }) => {
  await loginWithoutRole(page, request);
  await page.goto('./peminjam/');
  await expect(page).toHaveURL(/\/menunggu-role\/?$/);
});
