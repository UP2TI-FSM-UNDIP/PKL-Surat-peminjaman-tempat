import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

test('tombol, trigger select, dan option memakai cursor pointer', async ({
  page,
  request,
}) => {
  await loginAs(page, request, 'admin');

  await page.goto('admin/rooms');

  const addButton = page.getByRole('button', { name: 'Tambah Ruang' });
  await expect(addButton).toBeVisible();
  await expect(addButton).toHaveCSS('cursor', 'pointer');

  const trigger = page.getByRole('combobox').first();
  await expect(trigger).toHaveCSS('cursor', 'pointer');

  await trigger.click();
  const option = page.getByRole('option').first();
  await expect(option).toBeVisible();
  await expect(option).toHaveCSS('cursor', 'pointer');
  await page.keyboard.press('Escape');
});

test('kalender pointer dan tombol disabled tetap not-allowed', async ({
  page,
  request,
}) => {
  await loginAs(page, request, 'admin');

  await page.goto('admin/');

  const day = page.locator('.fc-daygrid-day').first();
  await expect(day).toBeVisible();
  await expect(day).toHaveCSS('cursor', 'pointer');

  await page.getByRole('button', { name: 'Ganti akun' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const disabledAccount = dialog.locator('button:disabled').first();
  await expect(disabledAccount).toHaveCSS('cursor', 'not-allowed');
});
