import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/wadek2/riwayat')({
  component: () => <h1 className="text-xl font-semibold">Riwayat Persetujuan</h1>,
});
