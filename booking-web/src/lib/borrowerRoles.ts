import type { RoleSlug } from '@/types/auth';

/** Role yang boleh meminjam ruang (selaras dengan ReservationController::BORROWER_ROLES). */
export const BORROWER_ROLES: readonly RoleSlug[] = ['peminjam', 'dosen', 'admin', 'spv-sumberdaya', 'manajer-tata-usaha', 'wadek2'];

export function canBorrow(slug: string | null | undefined): boolean {
  return !!slug && (BORROWER_ROLES as readonly string[]).includes(slug);
}

/** Peminjam murni (mahasiswa/dosen): beranda mereka adalah /peminjam. */
export function isPrimaryBorrower(slug: string | null | undefined): boolean {
  return slug === 'peminjam' || slug === 'dosen';
}
