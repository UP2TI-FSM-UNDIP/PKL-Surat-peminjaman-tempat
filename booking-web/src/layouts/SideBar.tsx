import type { LucideIcon } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar/sidebar';
import { useSidebar } from '@/components/ui/sidebar/sidebarContext';
import { ChevronsLeft } from 'lucide-react';
import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

export type MenuItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export type MenuSection = {
  label: string;
  items: MenuItem[];
};

export type SidebarFooterLink = {
  label: string;
  url: string;
  icon: LucideIcon;
};

type SideBarProps = {
  menuSections: MenuSection[];
  footerLink?: SidebarFooterLink;
};

/** Samakan path yang diakhiri slash, mis. `/admin/` dan `/admin`. */
const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

export function SideBar({ menuSections, footerLink }: SideBarProps) {
  const router = useRouterState();
  const currentPath = normalizePath(router.location.pathname);
  const { state, toggleSidebar, setOpen, isMobile } = useSidebar();
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // setOpen berganti identitas setiap state berubah; simpan di ref agar efek
  // di bawah hanya berjalan saat path berubah.
  const setOpenRef = useRef(setOpen);
  useEffect(() => {
    setOpenRef.current = setOpen;
  }, [setOpen]);

  // Desktop: sidebar terbuka saat kursor diarahkan dan menutup saat kursor
  // keluar. Jeda singkat mencegah kedip ketika kursor hanya melintas.
  const hoverTo = (open: boolean) => {
    if (isMobile) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpenRef.current(open), open ? 80 : 180);
  };

  useEffect(() => () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  }, []);

  // Tutup lagi setelah pindah halaman.
  useEffect(() => {
    setOpenRef.current(false);
  }, [currentPath]);

  return (
    <Sidebar
      collapsible='icon'
      variant='floating'
      onMouseEnter={() => hoverTo(true)}
      onMouseLeave={() => hoverTo(false)}
    >
      <SidebarHeader className='px-2 pt-2 pb-0'>
        <button
          type='button'
          onClick={toggleSidebar}
          aria-label={state === 'expanded' ? 'Ciutkan menu' : 'Buka menu'}
          className='flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
        >
          <ChevronsLeft className={cn('size-[18px] transition-transform duration-500 ease-[cubic-bezier(0.32,1.25,0.55,1)]', state === 'collapsed' && 'rotate-180')} />
        </button>
      </SidebarHeader>

      <SidebarContent>
        {menuSections.map((section, index) => (
          <SidebarGroup
            key={section.label}
            className={index < menuSections.length - 1 ? 'pb-2' : ''}
          >
            <SidebarGroupLabel className='px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80'>
              {section.label}
            </SidebarGroupLabel>
            <SidebarMenu>
              {section.items.map((item) => {
                const isActive = currentPath === normalizePath(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        'group/sidebar-item',
                        'h-10 rounded-full px-3 transition-all duration-300 group-data-[collapsible=icon]:rounded-full',
                        isActive
                          ? 'bg-accent! text-accent-foreground! hover:bg-accent!'
                          : 'hover:bg-muted!',
                      )}
                    >
                      <Link to={item.url}>
                        <item.icon
                          className={
                            isActive
                              ? 'text-primary'
                              : 'text-muted-foreground transition-colors group-hover/sidebar-item:text-foreground'
                          }
                        />
                        <span
                          className={cn(
                            'transition-[opacity,transform,color] duration-300 delay-100',
                            'group-data-[collapsible=icon]:-translate-x-2 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0',
                            'text-[13px]',
                            isActive
                              ? 'text-accent-foreground! font-semibold!'
                              : 'text-foreground',
                          )}
                        >
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {footerLink && (
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className='bg-primary text-primary-foreground hover:bg-primary/90'
              >
                <Link to={footerLink.url}>
                  <footerLink.icon />
                  <span>{footerLink.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
