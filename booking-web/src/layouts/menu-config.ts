import { Building2, CalendarDays, CalendarPlus, ClipboardList, DoorOpen, FileText, History, Home, LayoutDashboard, Users } from 'lucide-react';
import type { RoleSlug } from '@/types/auth';
import type { MenuSection, SidebarFooterLink } from './SideBar';

type MenuConfig = { menuSections: MenuSection[]; footerLink?: SidebarFooterLink };

// Penyetuju dan admin juga bisa melihat kalender dan meminjam ruang.
const ownBookingSection: MenuSection = {
  label: 'Peminjaman',
  items: [
    { title: 'Pinjam Ruang', url: '/peminjam/pinjam/baru', icon: CalendarPlus },
    { title: 'Pengajuan Saya', url: '/peminjam/pinjam', icon: FileText },
  ],
};

const approvalMenu = (base: string): MenuConfig => ({
  menuSections: [
    {
      label: 'Persetujuan',
      items: [
        { title: 'Beranda', url: '/peminjam', icon: Home },
        { title: 'Antrean', url: base, icon: ClipboardList },
        { title: 'Riwayat', url: `${base}/riwayat`, icon: History },
        { title: 'Manajemen Ruang', url: '/admin/rooms', icon: Building2 },
      ],
    },
    ownBookingSection,
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
      {
        label: 'Peminjaman Saya',
        items: [
          { title: 'Pinjam Ruang', url: '/peminjam/pinjam/baru', icon: CalendarPlus },
          { title: 'Pengajuan Saya', url: '/peminjam/pinjam', icon: FileText },
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
 * Ambil konfigurasi menu untuk role yang dikenal. Role tidak dikenal
 * (mis. nilai localStorage lama) tetap mendapat menu admin.
 */
export function getMenuConfig(role: RoleSlug): MenuConfig {
  return menuConfigurations[role] ?? menuConfigurations.admin;
}
