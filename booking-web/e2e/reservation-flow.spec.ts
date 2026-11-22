import { expect, test } from '@playwright/test';
import { API_BASE, loginAs } from './helpers/auth';
import { bookingDates } from './helpers/date';
import { createDraftReservation } from './helpers/reservation';

test.describe('reservasi multi-slot', () => {
  test.beforeEach(async ({ page, request }) => {
    await loginAs(page, request, 'peminjam');
  });

  test('membuat satu ruang banyak tanggal lalu masuk step proposal', async ({ page }) => {
    const dates = bookingDates(test.info().retry);
    await page.goto('./peminjam/pinjam/baru');
    await page.getByRole('button', { name: '1 ruang, banyak tanggal' }).click();
    await page.getByLabel('Ruang').click();
    await page.getByRole('option', { name: /F104/ }).click();
    await page.getByPlaceholder('Nama kegiatan / tujuan').fill('Rapat Panitia');
    await page.getByLabel('Nama ketua pelaksana').fill('Budi');
    await page.getByLabel('NIM/NIP/NIDN').fill('21040120140001');
    await page.getByLabel('Nomor HP').fill('081234567890');
    await page.getByRole('button', { name: 'Tambah tanggal' }).click();
    const dateInputs = page.getByLabel('Tanggal');
    await dateInputs.nth(0).fill(dates.a);
    await dateInputs.nth(1).fill(dates.b);
    await page.getByRole('button', { name: 'Simpan Reservasi' }).click();
    await expect(page).toHaveURL(/\/peminjam\/pinjam\/\d+\/proposal$/);
  });

  test('menampilkan Buka Sekat hanya untuk ruang bersebelahan', async ({ page }) => {
    await page.goto('./peminjam/pinjam/baru');
    await page.getByRole('button', { name: '1 tanggal, banyak ruang' }).click();
    await page.getByLabel('Tanggal').fill('2026-12-01');
    await page.getByRole('button', { name: 'Tambah ruang' }).click();
    await page.getByLabel('Ruang').nth(0).click();
    await page.getByRole('option', { name: /F104/ }).click();
    await page.getByLabel('Ruang').nth(1).click();
    await page.getByRole('option', { name: /F107/ }).click();
    await expect(page.getByLabel('Buka Sekat')).toBeVisible();
  });

  test('membuat satu tanggal banyak ruang sampai submit', async ({ page, request }) => {
    const dates = bookingDates(test.info().retry);
    const suffix = test.info().retry ? ` #${test.info().retry}` : '';
    const purpose = `Multi Ruang${suffix}`;
    await loginAs(page, request, 'peminjam');
    await page.goto('./peminjam/pinjam/baru');
    await expect(page.getByText('Undangan')).toHaveCount(0);
    await page.getByRole('button', { name: '1 tanggal, banyak ruang' }).click();
    await page.getByLabel('Tanggal').fill(dates.i);
    await page.getByRole('button', { name: 'Tambah ruang' }).click();
    await page.getByLabel('Ruang').nth(0).click();
    await page.getByRole('option', { name: /F104/ }).click();
    await page.getByLabel('Ruang').nth(1).click();
    await page.getByRole('option', { name: /F107/ }).click();
    await page.getByLabel('Buka Sekat').click();
    await page.getByPlaceholder('Nama kegiatan / tujuan').fill(purpose);
    await page.getByLabel('Nama ketua pelaksana').fill('Budi');
    await page.getByLabel('NIM/NIP/NIDN').fill('21040120140001');
    await page.getByLabel('Nomor HP').fill('081234567890');
    await page.getByRole('button', { name: 'Simpan Reservasi' }).click();
    await expect(page).toHaveURL(/\/peminjam\/pinjam\/\d+\/proposal$/);

    await page.getByLabel('Nama kegiatan', { exact: true }).fill(purpose);
    await page.getByLabel('Sifat kegiatan', { exact: true }).fill('Seminar');
    await page.getByLabel('Bentuk kegiatan', { exact: true }).fill('Offline');
    await page.getByLabel('Tujuan', { exact: true }).fill('Belajar');
    await page.getByLabel('Manfaat', { exact: true }).fill('Ilmu');
    await page.getByLabel('Sasaran peserta', { exact: true }).fill('Mahasiswa');
    await page.locator('#proposal').setInputFiles({
      name: 'proposal.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 test'),
    });
    await page.getByRole('button', { name: 'Simpan draf' }).click();
    await expect(page.getByText('Proposal PDF tersimpan')).toBeVisible();
    await page.getByRole('button', { name: 'Lanjut ke ringkasan' }).click();
    await expect(page).toHaveURL(/\/ringkasan$/);
    await page.getByRole('button', { name: 'Ajukan Peminjaman' }).click();
    await page.getByRole('button', { name: 'Ya, ajukan' }).click();
    await expect(page).toHaveURL(/\/peminjam\/pinjam\/\d+$/);
    await expect(page.getByText('Diproses', { exact: true })).toBeVisible();
  });

  test('step 1 read-only dan proposal menolak non-PDF', async ({ page, request }) => {
    const dates = bookingDates(test.info().retry);
    await loginAs(page, request, 'peminjam');
    await page.goto('./peminjam/pinjam/baru');
    await page.getByRole('button', { name: '1 ruang, banyak tanggal' }).click();
    await page.getByLabel('Ruang').click();
    await page.getByRole('option', { name: /F104/ }).click();
    await page.getByPlaceholder('Nama kegiatan / tujuan').fill('Read Only Test');
    await page.getByLabel('Nama ketua pelaksana').fill('Budi');
    await page.getByLabel('NIM/NIP/NIDN').fill('21040120140001');
    await page.getByLabel('Nomor HP').fill('081234567890');
    await page.getByLabel('Tanggal').nth(0).fill(dates.j);
    await page.getByRole('button', { name: 'Simpan Reservasi' }).click();
    await expect(page).toHaveURL(/\/peminjam\/pinjam\/\d+\/proposal$/);

    await page.getByRole('link', { name: 'Lihat detail' }).click();
    await expect(page.getByLabel('Nama kegiatan / tujuan')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Simpan Reservasi' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Lengkapi proposal' })).toBeVisible();
    await expect(page.getByText('Undangan')).toHaveCount(0);

    await page.getByRole('button', { name: 'Lengkapi proposal' }).click();
    await page.locator('#proposal').setInputFiles({
      name: 'catatan.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('bukan pdf'),
    });
    await page.getByRole('button', { name: 'Simpan draf' }).click();
    await expect(page.getByText(/Gagal menyimpan proposal|pdf/i).first()).toBeVisible();
  });

  test('slot yang sudah dipesan ditolak dan tidak membuat booking kedua', async ({ page, request }) => {
    const dates = bookingDates(test.info().retry);
    const suffix = test.info().retry ? ` #${test.info().retry}` : '';
    const auth = await loginAs(page, request, 'peminjam');

    await createDraftReservation(request, auth.token, {
      purpose: `Konflik Pertama${suffix}`,
      date: dates.k,
    });

    await page.goto('./peminjam/pinjam/baru');
    await page.getByRole('button', { name: '1 ruang, banyak tanggal' }).click();
    await page.getByLabel('Ruang').click();
    await page.getByRole('option', { name: /F104/ }).click();
    await page.getByPlaceholder('Nama kegiatan / tujuan').fill(`Konflik Kedua${suffix}`);
    await page.getByLabel('Nama ketua pelaksana').fill('Budi');
    await page.getByLabel('NIM/NIP/NIDN').fill('21040120140001');
    await page.getByLabel('Nomor HP').fill('081234567890');
    await page.getByLabel('Tanggal').nth(0).fill(dates.k);
    await expect(page.getByText(/bentrok/i).first()).toBeVisible();

    const bookingsResponse = await request.get(
      `${API_BASE}/room-bookings?date_from=${dates.k}&date_to=${dates.k}`,
      { headers: { Authorization: `Bearer ${auth.token}` } },
    );
    expect(bookingsResponse.ok()).toBeTruthy();
    const bookings = (await bookingsResponse.json()).data.data as Array<{ booking_date: string; status: string }>;
    expect(
      bookings.filter((booking) => booking.booking_date === dates.k && booking.status !== 'CANCELLED'),
    ).toHaveLength(1);
  });
});
