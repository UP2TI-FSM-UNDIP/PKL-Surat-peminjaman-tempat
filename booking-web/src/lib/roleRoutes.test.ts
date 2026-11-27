import { describe, expect, it } from 'vitest';
import { getRolePath, isPathInRole } from './roleRoutes';

describe('getRolePath', () => {
  it('memetakan enam slug', () => {
    expect(getRolePath('admin')).toBe('/admin/');
    expect(getRolePath('wadek2')).toBe('/peminjam/');
    expect(getRolePath('manajer-tata-usaha')).toBe('/peminjam/');
    expect(getRolePath('spv-sumberdaya')).toBe('/peminjam/');
    expect(getRolePath('peminjam')).toBe('/peminjam/');
    expect(getRolePath('dosen')).toBe('/peminjam/');
  });

  it('mengarahkan role kosong ke menunggu-role', () => {
    expect(getRolePath(null)).toBe('/menunggu-role');
  });

  it('menerima nama legacy selama migrasi', () => {
    expect(getRolePath('Wakil Dekan 2')).toBe('/peminjam/');
    expect(getRolePath('Supervisor Sumberdaya')).toBe('/peminjam/');
  });

  it('tidak menganggap properti prototype sebagai role', () => {
    expect(getRolePath('toString')).toBe('/peminjam/');
  });
});

describe('isPathInRole', () => {
  it('menerima base dan anaknya', () => {
    expect(isPathInRole('/admin', '/admin/')).toBe(true);
    expect(isPathInRole('/admin/rooms', '/admin/')).toBe(true);
  });

  it('menolak prefix yang bukan segmen', () => {
    expect(isPathInRole('/administrator', '/admin/')).toBe(false);
  });
});
