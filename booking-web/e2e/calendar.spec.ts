import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';
import { bookingDates } from './helpers/date';
import { createTwoSlotDraft } from './helpers/reservation';

test('kalender menampilkan warna, multi-slot, filter, dan copy tanggal', async ({ page, request }) => {
  const dates = bookingDates(test.info().retry);
  const suffix = test.info().retry ? ` #${test.info().retry}` : '';
  const purpose = `Calendar Test${suffix}`;
  const auth = await loginAs(page, request, 'peminjam');

  await createTwoSlotDraft(request, auth.token, {
    purpose,
    date: dates.g,
    secondDate: dates.o,
  });

  await page.goto('./peminjam/');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  const events = page.locator('.fc-event', { hasText: purpose });
  const target = new Date(`${dates.g}T00:00:00`);
  const now = new Date();
  const monthDiff = (target.getFullYear() - now.getFullYear()) * 12 + target.getMonth() - now.getMonth();

  for (let index = 0; index < monthDiff; index += 1) {
    await page.locator('.fc-next-button').click();
  }

  await expect(events.first()).toBeVisible();
  await expect(events.first().locator('.fc-daygrid-event-dot')).toHaveCSS(
    'border-color',
    'rgb(236, 72, 153)',
  );
  await events.first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: purpose })).toBeVisible();
  await expect(dialog.getByText('F104 —', { exact: false })).toBeVisible();
  await expect(dialog.getByRole('row').filter({ hasText: 'F104' })).toHaveCount(2);
  await expect(dialog.getByText('Slot reservasi')).toBeVisible();
  await dialog.getByRole('button', { name: 'Tutup' }).click();

  const filter = page.locator('button[aria-pressed]').filter({ hasText: 'Reservasi' });
  await filter.click();
  await expect(events).toHaveCount(0);
  await filter.click();
  await expect(events.first()).toBeVisible();

  await page
    .locator(`.fc-daygrid-day[data-date="${dates.g}"] .fc-daygrid-day-number`)
    .click();
  await expect(page.getByRole('heading', { name: 'Pilih Jenis Pengajuan' })).toBeVisible();
  await expect(page.getByRole('dialog').getByText('Tanggal:', { exact: false })).toBeVisible();
});
