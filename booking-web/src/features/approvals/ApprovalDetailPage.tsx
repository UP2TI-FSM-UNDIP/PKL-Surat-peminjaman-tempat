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
import { ReservationDetail, detailPanel as panel } from '@/features/bookings/ReservationDetail';
import { ApprovalActions } from './ApprovalActions';
import type { ApprovalBase } from './routes';

export function ApprovalDetailPage({ documentId, basePath }: { documentId: string; basePath: ApprovalBase }) {
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
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="space-y-2">
        <Link to={basePath} className="inline-flex items-center gap-0.5 text-[13px] font-medium text-primary hover:underline">
          <ChevronLeft className="size-4" /> Antrean persetujuan
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h1 className="text-lg font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
              {document.content?.event_name || document.content?.purpose || document.title}
            </h1>
            <p className="text-[13px] text-muted-foreground sm:text-[14px]">
              {document.creator?.name ?? '—'}
              {firstSlot && <> · {formatDateShort(firstSlot.booking_date)}</>}
              {summaryQuery.data.slots.length > 1 && <> · {summaryQuery.data.slots.length} slot</>}
            </p>
          </div>
          <DocumentStatusBadge doc={document} />
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <ReservationDetail document={document} summary={summaryQuery.data} />

        <div className="space-y-4 lg:sticky lg:top-24">
          {canAct && (
            <section className={panel}>
              <h2 className="text-[14px] font-semibold tracking-tight sm:text-[15px]">Keputusan Anda</h2>
              <p className="mt-1 mb-4 text-[13px] text-muted-foreground">Pengajuan ini menunggu persetujuan Anda.</p>
              <ApprovalActions documentId={documentId} onDone={() => navigate({ to: basePath })} />
            </section>
          )}
          <section className={panel}>
            <h2 className="mb-4 text-[14px] font-semibold tracking-tight sm:text-[15px]">Riwayat & alur</h2>
            <DocumentTimeline document={document} />
          </section>
        </div>
      </div>
    </div>
  );
}
