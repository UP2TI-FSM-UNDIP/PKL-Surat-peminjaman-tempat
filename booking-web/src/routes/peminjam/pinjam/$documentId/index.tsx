import { createFileRoute } from '@tanstack/react-router';

// BRIDGE PLACEHOLDER — Task 10 replaces this file with the reservation detail page.
export const Route = createFileRoute('/peminjam/pinjam/$documentId/')({
  component: DocumentDetailPlaceholderPage,
});

function DocumentDetailPlaceholderPage() {
  const { documentId } = Route.useParams();
  return (
    <div className="mx-auto max-w-4xl space-y-2">
      <h1 className="text-2xl font-semibold">Detail Reservasi</h1>
      <p className="text-sm text-muted-foreground">Dokumen #{documentId}.</p>
    </div>
  );
}
