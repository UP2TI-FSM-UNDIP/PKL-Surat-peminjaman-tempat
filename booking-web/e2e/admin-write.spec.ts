import { expect, test } from '@playwright/test';
import { API_BASE, loginAs } from './helpers/auth';

test('admin menyimpan policy, melihat audit, dan menghitung ulang', async ({ page, request }) => {
  const auth = await loginAs(page, request, 'admin');
  const headers = { Authorization: `Bearer ${auth.token}` };

  const originalResponse = await request.get(`${API_BASE}/admin/booking-policy`, { headers });
  expect(originalResponse.ok()).toBeTruthy();
  const original = (await originalResponse.json()).data;

  try {
    await page.goto('./admin/kebijakan-peminjaman');
    await page.getByLabel('Label tier 1').fill('E2E Audit');
    await page.getByRole('button', { name: 'Simpan', exact: true }).click();
    await expect(page.getByText('Kebijakan berlaku untuk reservasi baru.')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Diperbarui' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Hitung ulang kebijakan' }).click();
    await expect(page.getByText(/dokumen DRAFT\/REVISION akan diperbarui/)).toBeVisible();
  } finally {
    const payload = {
      name: original.name,
      min_booking_days: original.min_booking_days,
      max_dates_per_room: original.max_dates_per_room,
      max_rooms_per_date: original.max_rooms_per_date,
      max_total_room_hours: original.max_total_room_hours,
      tiers: original.tiers.map((tier) => ({
        min_days_before: tier.min_days_before,
        deadline_offset: tier.deadline_offset,
        label: tier.label,
      })),
    };

    const restore = await request.put(`${API_BASE}/admin/booking-policy`, {
      headers,
      data: payload,
    });
    expect(restore.ok()).toBeTruthy();
  }
});

test('admin menambah ruang uji lalu membersihkannya via API', async ({ page, request }) => {
  const auth = await loginAs(page, request, 'admin');
  const headers = { Authorization: `Bearer ${auth.token}` };
  const code = `E2E-01-${test.info().retry}`;

  const findRoom = async () => {
    const response = await request.get(`${API_BASE}/rooms?search=${code}&per_page=100`, { headers });
    expect(response.ok()).toBeTruthy();
    const rooms = (await response.json()).data.data as Array<{ id: number; code: string }>;
    return rooms.find((item) => item.code === code);
  };

  const stale = await findRoom();
  if (stale) {
    const deleted = await request.delete(`${API_BASE}/rooms/${stale.id}`, { headers });
    expect(deleted.ok()).toBeTruthy();
  }

  try {
    await page.goto('./admin/rooms');
    await page.getByRole('button', { name: 'Tambah Ruang' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Kode Ruangan').fill(code);
    await dialog.getByLabel('Nama Ruangan').fill('Ruang E2E');
    await dialog.getByLabel('Kapasitas Ruangan (opsional)').fill('30');
    await dialog.getByLabel('Boleh dibooking Senin–Jumat').check();
    await dialog.getByLabel('Grup sekat').fill('E2E');
    await dialog.getByLabel('Posisi sekat').fill('1');
    await dialog.getByRole('button', { name: 'Tambah', exact: true }).click();

    await expect(page.getByRole('cell', { name: code, exact: true })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: code }).getByText('Weekday')).toBeVisible();
  } finally {
    const created = await findRoom();
    if (created) {
      const deleted = await request.delete(`${API_BASE}/rooms/${created.id}`, { headers });
      expect(deleted.ok()).toBeTruthy();
    }
  }
});
