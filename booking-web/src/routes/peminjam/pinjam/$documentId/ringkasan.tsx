import { createFileRoute } from '@tanstack/react-router';

// BRIDGE PLACEHOLDER — Task 10 replaces this file with the summary and submit page.
export const Route = createFileRoute('/peminjam/pinjam/$documentId/ringkasan')({
  component: SummaryPlaceholderPage,
});

function SummaryPlaceholderPage() {
  const { documentId } = Route.useParams();
  return (
    <div className="mx-auto max-w-4xl space-y-2">
      <h1 className="text-2xl font-semibold">Ringkasan dan Pengajuan</h1>
      <p className="text-sm text-muted-foreground">Dokumen #{documentId} siap ditinjau.</p>
    </div>
  );
}
