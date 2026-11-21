import { useEffect, useState, type ReactNode } from 'react';
import type { AnyRouter } from '@tanstack/react-router';
import { authService } from '@/services/auth.service';
import type { AuthUser } from '@/types/auth';

interface Props {
  router: AnyRouter;
  children: ReactNode;
}

export function AuthBootstrap({ router, children }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!authService.isAuthenticated()) {
        if (!cancelled) setReady(true);
        return;
      }
      try {
        const user: AuthUser = await authService.getUser();
        if (!cancelled) {
          authService.saveUser(user);
          router.update({ context: { auth: { isAuthenticated: true, user } } });
        }
      } catch {
        authService.clearAuthData();
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return <div className="p-6 text-sm text-muted-foreground">Memuat sesi…</div>;
  }

  return <>{children}</>;
}
