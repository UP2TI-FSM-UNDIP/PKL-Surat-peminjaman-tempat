import { Outlet } from '@tanstack/react-router';
import { SideBar, TopBar, getMenuConfig } from '@/layouts';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { RoleSlug } from '@/types/auth';
import { useState } from 'react';

export function ApprovalLayout({ role }: { role: RoleSlug }) {
  const [open, setOpen] = useState(false);
  const menu = getMenuConfig(role);
  return (
    <SidebarProvider open={open} onOpenChange={setOpen} className="gap-0">
      <SideBar menuSections={menu.menuSections} footerLink={menu.footerLink} />
      <main className="flex w-full min-w-0 flex-1 flex-col">
        <TopBar />
        <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-6"><Outlet /></div>
      </main>
    </SidebarProvider>
  );
}
