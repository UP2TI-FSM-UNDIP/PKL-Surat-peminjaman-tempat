import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/manajer-tata-usaha/riwayat')({
  component: () => <h1 className="text-xl font-semibold">Riwayat Persetujuan</h1>,
});
