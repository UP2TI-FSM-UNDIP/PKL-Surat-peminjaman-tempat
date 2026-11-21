import { Building2, CalendarDays, ClipboardList, DoorOpen, History, Home, LayoutDashboard, Users } from 'lucide-react';
import type { RoleSlug } from '@/types/auth';
import type { MenuSection, SidebarFooterLink } from './SideBar';

type MenuConfig = { menuSections: MenuSection[]; footerLink?: SidebarFooterLink };

const approvalMenu = (base: string): MenuConfig => ({
  menuSections: [
    {
      label: 'Persetujuan',
      items: [
        { title: 'Antrean', url: base, icon: ClipboardList },
        { title: 'Riwayat', url: `${base}/riwayat`, icon: History },
        { title: 'Manajemen Ruang', url: '/admin/rooms', icon: Building2 },
      ],
    },
  ],
});

const borrowerMenu: MenuConfig = {
  menuSections: [
    {
      label: 'Menu Utama',
      items: [
        { title: 'Dashboard', url: '/peminjam', icon: Home },
        { title: 'Reservasi Ruang', url: '/peminjam/pinjam/baru', icon: CalendarDays },
        { title: 'Daftar Pengajuan', url: '/peminjam/pinjam', icon: ClipboardList },
      ],
    },
  ],
};

export const menuConfigurations: Record<RoleSlug, MenuConfig> = {
  admin: {
    menuSections: [
      { label: 'Dashboard', items: [{ title: 'Dashboard', url: '/admin', icon: LayoutDashboard }] },
      {
        label: 'Ruang',
        items: [
          { title: 'Daftar Peminjaman', url: '/admin/peminjaman', icon: ClipboardList },
          { title: 'Manajemen Ruang', url: '/admin/rooms', icon: Building2 },
          { title: 'Kebijakan Peminjaman', url: '/admin/kebijakan-peminjaman', icon: CalendarDays },
        ],
      },
      {
        label: 'Konfigurasi',
        items: [
          { title: 'Manajemen Pengguna', url: '/admin/users', icon: Users },
          { title: 'Manajemen Unit', url: '/admin/units', icon: Building2 },
          { title: 'Manajemen Alur', url: '/admin/workflows', icon: DoorOpen },
        ],
      },
    ],
  },
  wadek2: approvalMenu('/wadek2'),
  'manajer-tata-usaha': approvalMenu('/manajer-tata-usaha'),
  'spv-sumberdaya': approvalMenu('/spv-sumberdaya'),
  peminjam: borrowerMenu,
  dosen: borrowerMenu,
};

/**
 * Route legacy (wadek1, senat, dan seterusnya) masih memanggil nama role lama
 * sampai Task 14 menghapusnya. Guard route tersebut selalu mengalihkan sebelum
 * komponen dirender, jadi menu fallback admin tidak pernah tampil.
 *
 * @deprecated dihapus bersama route legacy di Task 14.
 */
type LegacyMenuRole = 'wadek1' | 'dosen-pendamping' | 'ketua-departemen' | 'ketua-ormawa' | 'kemahasiswaan' | 'sumber-daya' | 'senat';

export function getMenuConfig(role: RoleSlug | LegacyMenuRole): MenuConfig {
  const config = (menuConfigurations as Record<string, MenuConfig | undefined>)[role];
  return config ?? menuConfigurations.admin;
}
