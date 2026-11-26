import { createFileRoute, redirect } from '@tanstack/react-router';

import { TopBar } from '@/layouts/TopBar';
import { LoginModal } from '@/components/LoginModal';
import { RollLink } from '@/components/common/RollLink';
import { authService } from '@/services/auth.service';
import { useState } from 'react';
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

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <TopBar onLoginClick={() => setIsLoginModalOpen(true)} />
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      <main className='mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24'>
        <section className='mx-auto max-w-3xl text-center animate-in fade-in slide-in-from-bottom-2 duration-700'>
          <p className='text-[15px] font-semibold text-primary'>Peminjaman Ruang FSM</p>
          <h1 className='mt-3 text-[44px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground md:text-[64px]'>
            Pinjam ruang dan fasilitas,
            <br className='hidden md:block' />
            <span className='text-muted-foreground'> tanpa ribet.</span>
          </h1>
          <p className='mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground md:text-xl'>
            Satu tempat untuk reservasi, pengajuan proposal, dan persetujuan peminjaman ruang di Fakultas Sains dan Matematika Universitas Diponegoro.
          </p>
          <div className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'>
            <Button size='lg' onClick={() => setIsLoginModalOpen(true)} className='w-full sm:w-auto'>
              <RollLink>Mulai pinjam ruang</RollLink>
            </Button>
            <a href='#cara-kerja' className='inline-flex h-11 items-center gap-1 px-4 text-[15px] font-medium text-primary hover:underline'>
              Lihat cara kerjanya <span aria-hidden='true'>›</span>
            </a>
          </div>
        </section>

        <div className='relative mx-auto mt-14 max-w-4xl animate-in fade-in zoom-in-95 duration-700 delay-150'>
          <div className='overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-[0_30px_80px_-20px_rgb(0_0_0/0.18)]'>
            <img
              src={`${import.meta.env.BASE_URL}illustration.png`}
              alt='Ilustrasi kalender peminjaman ruang'
              className='mx-auto h-auto w-full max-w-3xl p-6 md:p-10'
            />
          </div>
        </div>

        <section id='cara-kerja' className='mx-auto mt-20 grid max-w-4xl gap-4 md:grid-cols-3'>
          {[
            { step: '1', title: 'Pilih tanggal', text: 'Lihat ketersediaan ruang di kalender, lalu pilih slot yang kosong.' },
            { step: '2', title: 'Reservasi atau ajukan', text: 'Tahan slot dulu, atau langsung ajukan bila proposal sudah lengkap.' },
            { step: '3', title: 'Pantau persetujuan', text: 'Status dari SPV, Manajer TU, hingga Wakil Dekan II terlihat langsung.' },
          ].map((item) => (
            <div key={item.step} className='rounded-2xl bg-white p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)] ring-1 ring-black/[0.06]'>
              <span className='flex size-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground'>{item.step}</span>
              <h2 className='mt-4 text-[17px] font-semibold tracking-tight'>{item.title}</h2>
              <p className='mt-1.5 text-[15px] leading-relaxed text-muted-foreground'>{item.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className='border-t border-black/[0.06] py-8'>
        <div className='mx-auto flex max-w-6xl items-center justify-between px-6 text-xs text-muted-foreground'>
          <span>Fakultas Sains dan Matematika, Universitas Diponegoro</span>
          <span>© 2026 Peminjaman Ruang FSM</span>
        </div>
      </footer>
    </div>
  );
}