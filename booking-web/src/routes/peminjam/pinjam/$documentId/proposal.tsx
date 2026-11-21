import { createFileRoute } from '@tanstack/react-router';

// BRIDGE PLACEHOLDER — Task 9 replaces this file with the real proposal form.
export const Route = createFileRoute('/peminjam/pinjam/$documentId/proposal')({
  component: ProposalPlaceholderPage,
});

function ProposalPlaceholderPage() {
  const { documentId } = Route.useParams();
  return (
    <div className="mx-auto max-w-4xl space-y-2">
      <h1 className="text-2xl font-semibold">Proposal Kegiatan</h1>
      <p className="text-sm text-muted-foreground">Dokumen #{documentId}</p>
    </div>
  );
}
