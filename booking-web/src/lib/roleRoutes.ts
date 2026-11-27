import type { RoleSlug } from '@/types/auth';

export const ROLE_HOME: Record<RoleSlug, string> = {
  admin: '/admin/',
  // Approver mendarat di kalender (beranda) yang menampilkan ringkasan antrean.
  wadek2: '/peminjam/',
  'manajer-tata-usaha': '/peminjam/',
  'spv-sumberdaya': '/peminjam/',
  peminjam: '/peminjam/',
  dosen: '/peminjam/',
};

const LEGACY_ROLE_NAMES: Record<string, RoleSlug> = {
  Admin: 'admin',
  'Wakil Dekan 2': 'wadek2',
  'Manajer Tata Usaha': 'manajer-tata-usaha',
  'Supervisor Sumberdaya': 'spv-sumberdaya',
  Mahasiswa: 'peminjam',
  Peminjam: 'peminjam',
  Dosen: 'dosen',
};

/** Basis menu persetujuan tiap role approver. */
export const APPROVAL_BASE: Partial<Record<RoleSlug, '/spv-sumberdaya' | '/manajer-tata-usaha' | '/wadek2'>> = {
  'spv-sumberdaya': '/spv-sumberdaya',
  'manajer-tata-usaha': '/manajer-tata-usaha',
  wadek2: '/wadek2',
};

export function getRolePath(value: string | null | undefined): string {
  if (!value) return '/menunggu-role';
  if (Object.hasOwn(ROLE_HOME, value)) return ROLE_HOME[value as RoleSlug];
  const legacy = Object.hasOwn(LEGACY_ROLE_NAMES, value) ? LEGACY_ROLE_NAMES[value] : undefined;
  return legacy ? ROLE_HOME[legacy] : '/peminjam/';
}

export function isPathInRole(pathname: string, basePath: string): boolean {
  const base = basePath.replace(/\/$/, '');
  return pathname === base || pathname.startsWith(`${base}/`);
}
