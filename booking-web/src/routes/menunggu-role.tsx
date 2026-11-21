import { createFileRoute, redirect } from '@tanstack/react-router';
import { authService } from '@/services/auth.service';

export const Route = createFileRoute('/menunggu-role')({
  beforeLoad: () => {
    if (!authService.isAuthenticated()) throw redirect({ to: '/' });
    const slug = authService.getRoleSlug();
    if (slug) throw redirect({ to: authService.getRolePath(slug) });
  },
  component: () => (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="text-xl font-semibold">Menunggu penetapan role</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Akun Anda sudah aktif, tetapi belum memiliki role. Hubungi admin fakultas.
      </p>
    </main>
  ),
});
