import { createFileRoute, redirect } from '@tanstack/react-router';

import { TopBar } from '@/layouts/TopBar';
import { LoginModal } from '@/components/LoginModal';
import { RollLink } from '@/components/common/RollLink';
import { authService } from '@/services/auth.service';
import { useState } from 'react';
import { LOCAL_LOGIN_ENABLED, startSsoLogin } from '@/lib/sso';
import { Callout } from '@/components/ui/callout';
import { Button } from '@/components/ui/button/button';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    // Landing hanya untuk tamu; user yang sudah login langsung ke dashboard role-nya.
    if (!authService.isAuthenticated()) return;
    throw redirect({ to: authService.getRolePath(authService.getRoleSlug()) });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Login langsung ke SSO; modal hanya dipakai bila login lokal diaktifkan.
  const handleLogin = () => {
    if (LOCAL_LOGIN_ENABLED) {
      setIsLoginModalOpen(true);
      return;
    }
    setLoginError(startSsoLogin());
  };

  return (
    // Satu layar penuh tanpa scroll: header + hero (teks & ilustrasi berdampingan).
    <div className='flex h-svh flex-col overflow-hidden bg-background text-foreground'>
      <TopBar onLoginClick={handleLogin} />
      {LOCAL_LOGIN_ENABLED && (
        <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
      )}

      <main className='mx-auto grid min-h-0 w-full max-w-6xl flex-1 items-center gap-8 px-6 py-6 md:grid-cols-2 md:gap-12'>
        <section className='text-center md:text-left animate-in fade-in slide-in-from-bottom-2 duration-700'>
          <p className='text-sm font-semibold text-primary'>Peminjaman Ruang FSM</p>
          <h1 className='mt-3 text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[44px] lg:text-[56px]'>
            Pinjam ruang dan fasilitas,
            <span className='text-muted-foreground'> tanpa ribet.</span>
          </h1>
          <p className='mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted-foreground md:mx-0 lg:text-[17px]'>
            Reservasi, pengajuan proposal, dan persetujuan peminjaman ruang Fakultas Sains dan Matematika UNDIP dalam satu tempat.
          </p>
          <div className='mt-7'>
            <Button size='lg' onClick={handleLogin} className='w-full sm:w-auto'>
              <RollLink>Masuk dengan SSO UNDIP</RollLink>
            </Button>
            {loginError && <Callout tone='danger' className='mt-4 text-left'>{loginError}</Callout>}
          </div>
        </section>

        <div className='hidden min-h-0 items-center justify-center md:flex'>
          {/* Ilustrasi PNG transparan, tanpa kotak pembungkus. */}
          <img
            src={`${import.meta.env.BASE_URL}illustration.png`}
            alt='Ilustrasi kalender peminjaman ruang'
            className='aspect-square h-auto max-h-[min(64svh,520px)] w-auto object-contain animate-in fade-in zoom-in-95 duration-700 delay-150'
          />
        </div>
      </main>
    </div>
  );
}
