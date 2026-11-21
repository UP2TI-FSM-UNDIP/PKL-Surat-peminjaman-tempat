import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/manajer-tata-usaha/')({
  component: () => <h1 className="text-xl font-semibold">Antrean Persetujuan</h1>,
});
