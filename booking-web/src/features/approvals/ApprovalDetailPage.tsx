import { authStorage } from '@/lib/authStorage';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { documentService } from '@/services/document.service';
import { reservationService } from '@/services/reservation.service';
import { DocumentStatusBadge } from '@/components/DocumentStatusBadge';
import { DocumentTimeline } from '@/components/common/DocumentTimeline';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateShort } from '@/lib/date';
import { ApprovalSummaryCard } from './ApprovalSummaryCard';
import { ApprovalActions } from './ApprovalActions';
import type { ApprovalBase } from './routes';

const panel = 'rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-6';

export function ApprovalDetailPage({ documentId, basePath }: { documentId: number; basePath: ApprovalBase }) {
  const navigate = useNavigate();
  const documentQuery = useQuery({ queryKey: ['document', documentId], queryFn: () => documentService.getDocument(documentId) });
  const summaryQuery = useQuery({ queryKey: ['reservation-summary', documentId], queryFn: () => reservationService.summary(documentId) });

  if (documentQuery.isLoading || summaryQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-8 w-64 rounded-full" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }
  if (!documentQuery.data || !summaryQuery.data) return <p className="text-muted-foreground">Dokumen tidak ditemukan.</p>;

  const document = documentQuery.data;
  const currentUserId = Number(authStorage.getItem('userId'));
  const canAct = document.status === 'IN_PROGRESS' && document.current_holder_id === currentUserId;
  const firstSlot = summaryQuery.data.slots[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-3">
        <Link to={basePath} className="inline-flex items-center gap-0.5 text-[13px] font-medium text-primary hover:underline">
          <ChevronLeft className="size-4" /> Antrean persetujuan
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-[28px] leading-tight">
              {document.content?.event_name ?? document.title}
            </h1>
            <p className="text-[15px] text-muted-foreground">
              {document.creator?.name ?? '—'}
              {firstSlot && <> · {formatDateShort(firstSlot.booking_date)}</>}
              {summaryQuery.data.slots.length > 1 && <> · {summaryQuery.data.slots.length} slot</>}
            </p>
          </div>
          <DocumentStatusBadge doc={document} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <ApprovalSummaryCard document={document} summary={summaryQuery.data} />

        <div className="space-y-6 lg:sticky lg:top-24">
          {canAct && (
            <section className={panel}>
              <h2 className="text-[15px] font-semibold tracking-tight sm:text-[17px]">Keputusan Anda</h2>
              <p className="mt-1 mb-4 text-[13px] text-muted-foreground">Pengajuan ini menunggu persetujuan Anda.</p>
              <ApprovalActions documentId={documentId} onDone={() => navigate({ to: basePath })} />
            </section>
          )}
          <section className={panel}>
            <h2 className="mb-4 text-[15px] font-semibold tracking-tight sm:text-[17px]">Riwayat & alur</h2>
            <DocumentTimeline document={document} />
          </section>
        </div>
      </div>
    </div>
  );
}
