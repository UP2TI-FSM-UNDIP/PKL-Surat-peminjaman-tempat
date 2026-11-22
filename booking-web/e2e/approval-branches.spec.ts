import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { API_BASE, loginAs } from './helpers/auth';
import { bookingDates } from './helpers/date';
import { createDraftReservation, submitReservation } from './helpers/reservation';

async function documentStatus(request: APIRequestContext, token: string, documentId: number): Promise<string> {
  const response = await request.get(`${API_BASE}/documents/${documentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()).data.status;
}

async function approveAs(
  page: Page,
  request: APIRequestContext,
  role: 'spv-sumberdaya' | 'manajer-tata-usaha' | 'wadek2',
  purpose: string,
): Promise<void> {
  await loginAs(page, request, role);
  await page.goto(`./${role}`);
  const row = page.getByRole('row').filter({ hasText: purpose });
  await row.getByRole('button', { name: 'Tinjau' }).click();
  await page.getByRole('button', { name: 'Setujui' }).click();
  await page.getByRole('button', { name: 'Ya, setujui' }).click();
  await expect(page).toHaveURL(new RegExp(`/${role}/?$`));
}

test('SPV mengembalikan pengajuan untuk revisi', async ({ page, request }) => {
  const dates = bookingDates(test.info().retry);
  const suffix = test.info().retry ? ` #${test.info().retry}` : '';
  const purpose = `Revisi Test${suffix}`;
  const auth = await loginAs(page, request, 'peminjam');
  const documentId = await createDraftReservation(request, auth.token, {
    purpose,
    date: dates.l,
  });
  await submitReservation(request, auth.token, documentId, purpose);

  await loginAs(page, request, 'spv-sumberdaya');
  await page.goto('./spv-sumberdaya');
  const row = page.getByRole('row').filter({ hasText: purpose });
  await row.getByRole('button', { name: 'Tinjau' }).click();
  await page.getByRole('button', { name: 'Revisi' }).click();
  await page.getByLabel('Catatan').fill('Lengkapi susunan acara.');
  await page.getByRole('button', { name: 'Kirim revisi' }).click();
  await expect(page).toHaveURL(/\/spv-sumberdaya\/?$/);

  expect(await documentStatus(request, auth.token, documentId)).toBe('REVISION');
});

test('SPV menolak pengajuan dengan catatan minimal', async ({ page, request }) => {
  const dates = bookingDates(test.info().retry);
  const suffix = test.info().retry ? ` #${test.info().retry}` : '';
  const purpose = `Tolak Test${suffix}`;
  const auth = await loginAs(page, request, 'peminjam');
  const documentId = await createDraftReservation(request, auth.token, {
    purpose,
    date: dates.m,
  });
  await submitReservation(request, auth.token, documentId, purpose);

  await loginAs(page, request, 'spv-sumberdaya');
  await page.goto('./spv-sumberdaya');
  const row = page.getByRole('row').filter({ hasText: purpose });
  await row.getByRole('button', { name: 'Tinjau' }).click();
  await page.getByRole('button', { name: 'Tolak' }).click();
  await page.getByLabel('Catatan').fill('Jadwal tidak sesuai.');
  await page.getByRole('button', { name: 'Ya, tolak' }).click();
  await expect(page).toHaveURL(/\/spv-sumberdaya\/?$/);

  expect(await documentStatus(request, auth.token, documentId)).toBe('REJECTED');
});

test('approver di luar giliran tidak melihat tombol Tinjau', async ({ page, request }) => {
  const dates = bookingDates(test.info().retry);
  const suffix = test.info().retry ? ` #${test.info().retry}` : '';
  const purpose = `Out Of Turn${suffix}`;
  const auth = await loginAs(page, request, 'peminjam');
  const documentId = await createDraftReservation(request, auth.token, {
    purpose,
    date: dates.n,
  });
  await submitReservation(request, auth.token, documentId, purpose);

  await loginAs(page, request, 'manajer-tata-usaha');
  await page.goto('./manajer-tata-usaha');
  const row = page.getByRole('row').filter({ hasText: purpose });
  await expect(row.getByRole('button', { name: 'Tinjau' })).toHaveCount(0);
});

test('TU mengembalikan pengajuan untuk revisi setelah SPV menyetujui', async ({ page, request }) => {
  const dates = bookingDates(test.info().retry);
  const suffix = test.info().retry ? ` #${test.info().retry}` : '';
  const purpose = `TU Revisi Test${suffix}`;
  const auth = await loginAs(page, request, 'peminjam');
  const documentId = await createDraftReservation(request, auth.token, {
    purpose,
    date: dates.q,
  });
  await submitReservation(request, auth.token, documentId, purpose);
  await approveAs(page, request, 'spv-sumberdaya', purpose);

  await loginAs(page, request, 'manajer-tata-usaha');
  await page.goto('./manajer-tata-usaha');
  const row = page.getByRole('row').filter({ hasText: purpose });
  await row.getByRole('button', { name: 'Tinjau' }).click();
  await page.getByRole('button', { name: 'Revisi' }).click();
  await page.getByLabel('Catatan').fill('Perbaiki berkas proposal.');
  await page.getByRole('button', { name: 'Kirim revisi' }).click();
  await expect(page).toHaveURL(/\/manajer-tata-usaha\/?$/);

  expect(await documentStatus(request, auth.token, documentId)).toBe('REVISION');
});

test('TU menolak pengajuan setelah SPV menyetujui', async ({ page, request }) => {
  const dates = bookingDates(test.info().retry);
  const suffix = test.info().retry ? ` #${test.info().retry}` : '';
  const purpose = `TU Tolak Test${suffix}`;
  const auth = await loginAs(page, request, 'peminjam');
  const documentId = await createDraftReservation(request, auth.token, {
    purpose,
    date: dates.r,
  });
  await submitReservation(request, auth.token, documentId, purpose);
  await approveAs(page, request, 'spv-sumberdaya', purpose);

  await loginAs(page, request, 'manajer-tata-usaha');
  await page.goto('./manajer-tata-usaha');
  const row = page.getByRole('row').filter({ hasText: purpose });
  await row.getByRole('button', { name: 'Tinjau' }).click();
  await page.getByRole('button', { name: 'Tolak' }).click();
  await page.getByLabel('Catatan').fill('Dokumen tidak lengkap.');
  await page.getByRole('button', { name: 'Ya, tolak' }).click();
  await expect(page).toHaveURL(/\/manajer-tata-usaha\/?$/);

  expect(await documentStatus(request, auth.token, documentId)).toBe('REJECTED');
});
