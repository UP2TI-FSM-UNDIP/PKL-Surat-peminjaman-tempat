import { expect, test } from '@playwright/test';
import { loginAsProfile } from './helpers/auth';

test('melengkapi profil hanya nama dan NIM/NIP', async ({ page, request }) => {
  await loginAsProfile(page, request);

  await page.goto('./peminjam');

  await expect(page.getByText('Lengkapi Profil Anda')).toBeVisible();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByPlaceholder('Nama lengkap')).toHaveValue(
    'E2E Profil Belum Lengkap',
  );
  await expect(dialog.getByPlaceholder('NIM/NIP')).toBeVisible();
  await expect(dialog.getByPlaceholder(/unit/i)).toHaveCount(0);
  await expect(dialog.getByLabel(/^unit$/i)).toHaveCount(0);

  await dialog.getByPlaceholder('Nama lengkap').fill('Profil E2E');
  await dialog.getByPlaceholder('NIM/NIP').fill('21040120140001');
  await dialog.getByRole('button', { name: 'Simpan' }).click();

  await expect(page.getByText('Lengkapi Profil Anda')).toBeHidden();
  await expect(page.locator('input[placeholder="Unit"]')).toHaveCount(0);
});
