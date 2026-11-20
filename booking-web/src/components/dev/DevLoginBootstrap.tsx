import { useEffect, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { authService } from '@/services/auth.service';
import {
  DEV_LOGIN_OPT_OUT_KEY,
  DEV_LOGIN_UI_ENABLED,
  devService,
} from '@/services/dev.service';

/**
 * Promise modul-level supaya React StrictMode tidak memicu dua login.
 * Effect kedua cukup menunggu promise yang sama.
 */
let bootstrapPromise: Promise<void> | null = null;

function basePath(): string {
  return (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
}

function isAtBaseRoot(): boolean {
  const path = window.location.pathname.replace(/\/+$/, '');
  return path === basePath();
}

function adminUrl(): string {
  return `${basePath()}/admin/`.replace(/\/{2,}/g, '/');
}

function isSsoFlow(): boolean {
  if (new URLSearchParams(window.location.search).has('token')) {
    return true;
  }

  return /\/(sso\/callback|redirect)\/?$/.test(window.location.pathname);
}

async function bootstrapDevLogin(): Promise<void> {
  try {
    if (!DEV_LOGIN_UI_ENABLED) return;
    if (localStorage.getItem('token')) return;
    if (isSsoFlow()) return;
    if (sessionStorage.getItem(DEV_LOGIN_OPT_OUT_KEY) === '1') return;

    const session = await devService.session();
    if (!session?.enabled || !session.default_user_id) return;

    const response = await devService.login(session.default_user_id);
    authService.saveAuthData(response);

    // Hanya landing yang diarahkan otomatis. Deep link dibiarkan, guard role
    // yang akan memindahkan bila path-nya tidak cocok.
    if (isAtBaseRoot()) {
      window.location.replace(adminUrl());
    }
  } catch {
    // API mati atau dev login dimatikan: aplikasi lanjut seperti biasa.
  }
}

export function DevLoginBootstrap({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!DEV_LOGIN_UI_ENABLED);

  useEffect(() => {
    if (!DEV_LOGIN_UI_ENABLED) return;

    if (!bootstrapPromise) {
      bootstrapPromise = bootstrapDevLogin();
    }

    let active = true;
    bootstrapPromise.finally(() => {
      if (active) setReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-white'>
        <div className='flex items-center gap-3 text-sm font-medium text-muted-foreground'>
          <Loader2 className='h-4 w-4 animate-spin text-primary' />
          Menyiapkan mode dev...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
