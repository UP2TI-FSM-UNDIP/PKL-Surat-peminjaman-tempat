import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

const cases = [
  ['admin', '/admin/'],
  ['wadek2', '/wadek2/'],
  ['manajer-tata-usaha', '/manajer-tata-usaha/'],
  ['spv-sumberdaya', '/spv-sumberdaya/'],
  ['peminjam', '/peminjam/'],
  ['dosen', '/peminjam/'],
] as const;

for (const [role, path] of cases) {
  test(`role ${role} mendarat di ${path}`, async ({ page, request }) => {
    await loginAs(page, request, role);
    await page.goto('./');
    await expect(page).toHaveURL(new RegExp(`${path.replace(/\//g, '\\/')}$`));
  });
}
