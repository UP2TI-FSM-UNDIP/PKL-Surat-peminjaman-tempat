import { expect, test } from '@playwright/test';
import { loginAs } from './helpers/auth';

const pngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
);

test('foto ruangan bisa dipilih dan dijatuhkan ke drop zone', async ({
  page,
  request,
}) => {
  await loginAs(page, request, 'admin');

  await page.goto('admin/rooms');
  await page.getByRole('button', { name: 'Tambah Ruang' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const zone = dialog.getByRole('button', {
    name: 'Pilih atau seret foto ruangan',
  });

  await dialog.locator('input[type="file"]').setInputFiles({
    name: 'foto.png',
    mimeType: 'image/png',
    buffer: pngBuffer,
  });
  await expect(dialog.getByText('foto.png')).toBeVisible();

  const imageTransfer = await page.evaluateHandle(() => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File([new Uint8Array([137, 80, 78, 71])], 'drag.png', {
        type: 'image/png',
      }),
    );
    return transfer;
  });

  await zone.dispatchEvent('dragenter', { dataTransfer: imageTransfer });
  await expect(zone).toHaveAttribute('data-dragging', 'true');

  await zone.dispatchEvent('drop', { dataTransfer: imageTransfer });
  await expect(dialog.getByText('drag.png')).toBeVisible();

  const textTransfer = await page.evaluateHandle(() => {
    const transfer = new DataTransfer();
    transfer.items.add(
      new File(['bukan gambar'], 'catatan.txt', { type: 'text/plain' }),
    );
    return transfer;
  });

  await zone.dispatchEvent('drop', { dataTransfer: textTransfer });
  await expect(
    dialog.getByText(/Format file tidak didukung/),
  ).toBeVisible();
});
