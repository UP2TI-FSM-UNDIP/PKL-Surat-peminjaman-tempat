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
  SidebarTrigger,
} from '@/components/ui/sidebar/sidebar';
import { Link, useRouterState } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

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

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='pt-6'>
        <SidebarTrigger className='text-foreground group-data-[collapsible=icon]:ml-0' />
      </SidebarHeader>

      <SidebarContent>
        {menuSections.map((section, index) => (
          <SidebarGroup
            key={section.label}
            className={
              index < menuSections.length - 1
                ? 'border-b border-border pb-4'
                : ''
            }
          >
            <SidebarGroupLabel className='text-muted-foreground uppercase text-xs'>
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
                        isActive
                          ? 'bg-primary! text-primary-foreground! hover:bg-primary!'
                          : 'hover:bg-secondary! hover:text-secondary-foreground!',
                      )}
                    >
                      <Link to={item.url}>
                        <item.icon
                          className={
                            isActive
                              ? 'text-primary-foreground'
                              : 'text-muted-foreground transition-colors group-hover/sidebar-item:text-secondary-foreground'
                          }
                        />
                        <span
                          className={cn(
                            'transition-[opacity,transform,color] duration-200',
                            'group-data-[collapsible=icon]:-translate-x-1 group-data-[collapsible=icon]:opacity-0',
                            isActive
                              ? 'text-primary-foreground! font-semibold!'
                              : 'text-foreground transition-colors group-hover/sidebar-item:text-secondary-foreground',
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
