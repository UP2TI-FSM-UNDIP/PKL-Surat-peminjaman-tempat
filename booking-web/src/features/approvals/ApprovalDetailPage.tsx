import { authStorage } from '@/lib/authStorage';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { documentService } from '@/services/document.service';
import { reservationService } from '@/services/reservation.service';
import { ApprovalSummaryCard } from './ApprovalSummaryCard';
import { ApprovalActions } from './ApprovalActions';
import type { ApprovalBase } from './routes';

export function ApprovalDetailPage({ documentId, basePath }: { documentId: number; basePath: ApprovalBase }) {
  const navigate = useNavigate();
  const documentQuery = useQuery({ queryKey: ['document', documentId], queryFn: () => documentService.getDocument(documentId) });
  const summaryQuery = useQuery({ queryKey: ['reservation-summary', documentId], queryFn: () => reservationService.summary(documentId) });

  if (documentQuery.isLoading || summaryQuery.isLoading) return <p>Memuat…</p>;
  if (!documentQuery.data || !summaryQuery.data) return <p>Dokumen tidak ditemukan.</p>;

  const currentUserId = Number(authStorage.getItem('userId'));
  const canAct = documentQuery.data.status === 'IN_PROGRESS' && documentQuery.data.current_holder_id === currentUserId;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">{documentQuery.data.content?.event_name ?? documentQuery.data.title}</h1>
      <ApprovalSummaryCard document={documentQuery.data} summary={summaryQuery.data} />
      <div>
        <h2 className="mb-2 text-lg font-semibold">Timeline</h2>
        <ol className="space-y-2 text-sm">
          {documentQuery.data.logs?.map((log) => (
            <li key={log.id} className="rounded-md border p-2">
              <span className="font-medium">{log.action}</span> — {log.note ?? 'Tanpa catatan'} ({log.created_at})
            </li>
          ))}
        </ol>
      </div>
      {canAct && <ApprovalActions documentId={documentId} onDone={() => navigate({ to: basePath })} />}
    </div>
  );
}
