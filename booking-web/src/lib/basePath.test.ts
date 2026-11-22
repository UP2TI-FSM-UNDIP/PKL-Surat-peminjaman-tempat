import { describe, expect, it } from 'vitest';
import { routerBasePath } from './basePath';

describe('routerBasePath', () => {
  it('menghapus trailing slash', () => {
    expect(routerBasePath('/peminjaman-ruang/')).toBe('/peminjaman-ruang');
  });

  it('mempertahankan path staging', () => {
    expect(routerBasePath('/peminjaman-ruang-staging/')).toBe('/peminjaman-ruang-staging');
  });

  it('menangani root', () => {
    expect(routerBasePath('/')).toBe('');
  });
});
