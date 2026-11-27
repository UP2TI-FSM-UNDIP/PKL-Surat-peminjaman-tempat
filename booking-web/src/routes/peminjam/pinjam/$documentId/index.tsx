import { DocumentTimeline } from '@/components/common/DocumentTimeline';
import { useState } from 'react';
import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { documentService } from '@/services/document.service';
import { reservationService } from '@/services/reservation.service';
import { getErrorMessage } from '@/lib/errors';
import { DocumentStatusBadge } from '@/components/DocumentStatusBadge';
import { ReservationDetail, detailPanel } from '@/features/bookings/ReservationDetail';
import { formatDateShort } from '@/lib/date';
import { ChevronLeft } from 'lucide-react';
import { BookingQr } from '@/features/bookings/BookingQr';

export const Route = createFileRoute('/peminjam/pinjam/$documentId/')({ component: DetailPage });

function DetailPage() {
  const { documentId } = useParams({ from: '/peminjam/pinjam/$documentId/' });
  const id = documentId;
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');

  const documentQuery = useQuery({ queryKey: ['document', id], queryFn: () => documentService.getDocument(id) });
  const summaryQuery = useQuery({ queryKey: ['reservation-summary', id], queryFn: () => reservationService.summary(id) });
  const document = documentQuery.data;
  const summary = summaryQuery.data;

  const cancel = useMutation({
    mutationFn: () => reservationService.cancel(id, reason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['document', id] });
      await queryClient.invalidateQueries({ queryKey: ['reservation-summary', id] });
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      await queryClient.invalidateQueries({ queryKey: ['room-bookings'] });
      setCancelOpen(false);
      toast.success('Reservasi dibatalkan.');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Gagal membatalkan reservasi.')),
  });

  if (documentQuery.isLoading || summaryQuery.isLoading) return <p>Memuat…</p>;
  if (!document || !summary) return <p>Dokumen tidak ditemukan.</p>;

  const terminalReason = [...(document.logs ?? [])]
    .reverse()
    .find((log) => ['REJECTED', 'CANCELLED', 'EXPIRED'].includes(log.action))?.note;

  const editable = document.status === 'DRAFT' || document.status === 'REVISION';
  const canCancel = ['DRAFT', 'REVISION', 'IN_PROGRESS'].includes(document.status);
  const approvedBookings = document.status === 'APPROVED' ? document.room_bookings ?? [] : [];
  const slotLabel = (booking: { room_id: number; booking_date: string }) => {
    const slot = summary.slots.find((s) => s.room_id === booking.room_id && s.booking_date === booking.booking_date);
    return `${slot?.room_code ?? slot?.room_name ?? 'Ruang'} · ${formatDateShort(booking.booking_date)}`;
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:gap-4">
      <div>
        <Link to="/peminjam/pinjam" search={{ status: "" }} className="-ml-1 inline-flex items-center gap-0.5 text-[13px] font-medium text-primary hover:underline">
          <ChevronLeft className="size-4" /> Pengajuan saya
        </Link>
        <h1 className="mt-1 text-[17px] font-semibold leading-snug tracking-tight sm:text-2xl">
          {document.content?.event_name || document.content?.purpose || document.title}
        </h1>
        <div className="mt-1.5"><DocumentStatusBadge doc={document} /></div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="order-2 min-w-0 lg:order-1"><ReservationDetail document={document} summary={summary} /></div>

        <div className="order-1 flex flex-col gap-3 sm:gap-4 lg:sticky lg:top-24 lg:order-2">
          {(editable || canCancel || document.status !== 'IN_PROGRESS') && (
            <section className="lg:rounded-2xl lg:border lg:border-black/[0.06] lg:bg-white lg:p-5 lg:shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
              <div className="flex flex-wrap gap-2">
                {editable && (
                  <Link to="/peminjam/pinjam/$documentId/proposal" params={{ documentId }} className="flex-1">
                    <Button size="sm" className="w-full">Lengkapi proposal</Button>
                  </Link>
                )}
                {canCancel && (
                  <Button size="sm" variant="outline" className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive" onClick={() => setCancelOpen(true)}>
                    Batalkan pengajuan
                  </Button>
                )}
                {!editable && !canCancel && (
                  <Link to="/peminjam/pinjam/baru" className="flex-1"><Button size="sm" variant="outline" className="w-full">Buat pengajuan baru</Button></Link>
                )}
              </div>
              {terminalReason && (
                <p className="mt-3 rounded-xl bg-muted/70 p-2.5 text-[13px]"><span className="font-semibold">Alasan: </span>{terminalReason}</p>
              )}
            </section>
          )}

          {approvedBookings.length > 0 && (
            <section className={detailPanel}>
              <h2 className="mb-1 text-[14px] font-semibold tracking-tight sm:text-[15px]">Bukti peminjaman</h2>
              <p className="mb-3 text-xs text-muted-foreground">Tunjukkan QR ke petugas saat memakai ruang.</p>
              <div className="grid grid-cols-2 gap-3">
                {approvedBookings.map((booking) => (
                  <div key={booking.id} className="flex flex-col items-center rounded-xl bg-muted/50 p-2 text-center">
                    <BookingQr bookingId={booking.id} label={slotLabel(booking)} />
                    <p className="mt-1 text-[11px] font-medium leading-tight">{slotLabel(booking)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className={`${detailPanel} hidden lg:block`}>
            <h2 className="mb-3 text-[14px] font-semibold tracking-tight sm:text-[15px]">Riwayat & alur</h2>
            <DocumentTimeline document={document} />
          </section>
        </div>

        <section className={`${detailPanel} order-3 lg:hidden`}>
          <h2 className="mb-3 text-[14px] font-semibold tracking-tight">Riwayat & alur</h2>
          <DocumentTimeline document={document} />
        </section>
      </div>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan reservasi?</DialogTitle>
            <DialogDescription>Semua slot yang masih PENDING akan dibatalkan.</DialogDescription>
          </DialogHeader>
          <Input aria-label="Alasan (opsional)" placeholder="Alasan (opsional)" value={reason} onChange={(event) => setReason(event.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Tidak</Button>
            <Button variant="destructive" onClick={() => cancel.mutate()} disabled={cancel.isPending}>Ya, batalkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
