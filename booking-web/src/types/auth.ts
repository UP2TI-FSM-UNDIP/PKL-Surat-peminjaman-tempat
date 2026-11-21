export const ROLE_SLUGS = [
  'admin',
  'wadek2',
  'manajer-tata-usaha',
  'spv-sumberdaya',
  'peminjam',
  'dosen',
] as const;

export type RoleSlug = (typeof ROLE_SLUGS)[number];

export interface AuthRole {
  id: number;
  name: string;
  slug: RoleSlug;
}

export interface AuthUnit {
  id: number;
  name: string;
  code?: string | null;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  nim_nip?: string | null;
  role: AuthRole | null;
  unit?: AuthUnit | null;
  is_profile_completed: boolean;
}

export function isRoleSlug(value: string | null | undefined): value is RoleSlug {
  return !!value && (ROLE_SLUGS as readonly string[]).includes(value);
}
