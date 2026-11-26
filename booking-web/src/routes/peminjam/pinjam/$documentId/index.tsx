import { DocumentTimeline } from '@/components/common/DocumentTimeline';
import { useState } from 'react';
import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { documentService } from '@/services/document.service';
import { reservationService } from '@/services/reservation.service';
import { bookingService } from '@/services/booking.service';
import { getErrorMessage } from '@/lib/errors';
import { DocumentStatusBadge } from '@/components/DocumentStatusBadge';
import { PageHeader } from '@/components/common/PageHeader';
import { ReservationSummaryCard } from '@/features/bookings/ReservationSummaryCard';
import { BookingQr } from '@/features/bookings/BookingQr';

export const Route = createFileRoute('/peminjam/pinjam/$documentId/')({ component: DetailPage });

function DetailPage() {
  const { documentId } = useParams({ from: '/peminjam/pinjam/$documentId/' });
  const id = Number(documentId);
  const queryClient = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [receipts, setReceipts] = useState<Record<number, Record<string, unknown>>>({});

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

  const openProposal = async () => {
    const tab = window.open('', '_blank');
    if (!tab) {
      toast.error('Popup diblokir. Izinkan popup untuk melihat proposal.');
      return;
    }
    tab.opener = null;
    try {
      const { objectUrl } = await documentService.fetchFileUrl(id);
      tab.location.href = objectUrl;
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      tab.close();
      toast.error(getErrorMessage(error, 'Proposal tidak dapat dibuka.'));
    }
  };
  const terminalReason = [...(document.logs ?? [])]
    .reverse()
    .find((log) => ['REJECTED', 'CANCELLED', 'EXPIRED'].includes(log.action))?.note;

  const editable = document.status === 'DRAFT' || document.status === 'REVISION';
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={document.title} badge={<DocumentStatusBadge doc={document} />} />
      <ReservationSummaryCard document={document} summary={summary} onOpenProposal={openProposal} />
      {terminalReason && (
        <section className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-6">
          <h2 className="text-[17px] font-semibold tracking-tight">Alasan</h2>
          <p className="mt-2 text-[14px]">{terminalReason}</p>
        </section>
      )}
      <section className="space-y-4 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-6">
        <h2 className="text-[17px] font-semibold tracking-tight">Riwayat & alur</h2>
        <DocumentTimeline document={document} />
      </section>
      <div className="flex flex-wrap gap-2">
        {editable && <Link to="/peminjam/pinjam/$documentId/proposal" params={{ documentId }}><Button>Lengkapi proposal</Button></Link>}
        {['DRAFT', 'REVISION', 'IN_PROGRESS'].includes(document.status) && (
          <Button variant="destructive" onClick={() => setCancelOpen(true)}>Batalkan</Button>
        )}
        {!editable && document.status !== 'IN_PROGRESS' && (
          <Link to="/peminjam/pinjam/baru"><Button variant="outline">Buat baru</Button></Link>
        )}
      </div>
      {document.status === 'APPROVED' && document.room_bookings?.map((booking) => (
        <Card key={booking.id}>
          <CardHeader><CardTitle className="text-base">Bukti peminjaman {booking.id}</CardTitle></CardHeader>
          <CardContent><BookingQr bookingId={booking.id} /></CardContent>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const data = await bookingService.receipt(booking.id);
                  setReceipts((current) => ({ ...current, [booking.id]: data }));
                } catch (error) {
                  toast.error(getErrorMessage(error, 'Gagal memuat receipt.'));
                }
              }}
            >
              Lihat receipt
            </Button>
            {receipts[booking.id] && (
              <pre className="max-h-64 overflow-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(receipts[booking.id], null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      ))}

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
