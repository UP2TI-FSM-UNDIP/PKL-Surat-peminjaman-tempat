import { SideBar, TopBar, getMenuConfig } from '@/layouts';
import { SidebarProvider } from '@/components/ui/sidebar';
import { authService } from '@/services/auth.service';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import React from 'react';

export const Route = createFileRoute('/admin')({
  beforeLoad: ({ location }) => {
    if (!authService.isAuthenticated()) throw redirect({ to: '/' });
    const slug = authService.getRoleSlug();
    const path = location.pathname;
    const isRooms = path === '/admin/rooms' || path.startsWith('/admin/rooms/');
    const allowedRoomManagers = ['admin', 'wadek2', 'manajer-tata-usaha', 'spv-sumberdaya'];
    if (slug !== 'admin' && !(isRooms && slug && allowedRoomManagers.includes(slug))) {
      throw redirect({ to: authService.getRolePath(slug) });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [open, setOpen] = React.useState(false);
  const slug = authService.getRoleSlug() ?? 'admin';
  const menuConfig = getMenuConfig(slug);

  return (
    <SidebarProvider open={open} onOpenChange={setOpen} className='gap-0'>
      <SideBar menuSections={menuConfig.menuSections} footerLink={menuConfig.footerLink} />
      <main className='flex-1 flex flex-col w-full min-w-0'>
        <TopBar />
        <div className='flex-1 p-6 space-y-6'>
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}
