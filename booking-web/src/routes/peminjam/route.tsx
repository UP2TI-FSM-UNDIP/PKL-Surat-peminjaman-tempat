import { authService } from '@/services/auth.service';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SideBar, TopBar, getMenuConfig } from '@/layouts';
import { isPathInRole } from '@/lib/roleRoutes';

export const Route = createFileRoute('/peminjam')({
  beforeLoad: ({ location }) => {
    if (!authService.isAuthenticated()) throw redirect({ to: '/' });
    const slug = authService.getRoleSlug();
    if (slug !== 'peminjam' && slug !== 'dosen') {
      throw redirect({ to: authService.getRolePath(slug) });
    }
    if (!isPathInRole(location.pathname, '/peminjam')) {
      throw redirect({ to: '/peminjam' });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [open, setOpen] = React.useState(false);
  const menuConfig = getMenuConfig('peminjam');

  return (
    <SidebarProvider open={open} onOpenChange={setOpen} className='gap-0'>
      <SideBar
        menuSections={menuConfig.menuSections}
        footerLink={menuConfig.footerLink}
      />
      <main className='flex-1 flex flex-col w-full min-w-0'>
        <TopBar actionLabel='Login' />
        <div className='mx-auto w-full max-w-7xl flex-1 p-6 space-y-6'>
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}
