import { useState } from 'react';
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { reservationService } from '@/services/reservation.service';
import { documentService } from '@/services/document.service';
import { missingLabels } from '@/lib/completeness';
import { getErrorMessage, getErrorStatus } from '@/lib/errors';
import { ReservationSummaryCard } from '@/features/bookings/ReservationSummaryCard';
import type { AvailabilityBatchSlot } from '@/types/reservation';

export const Route = createFileRoute('/peminjam/pinjam/$documentId/ringkasan')({ component: SummaryPage });

function SummaryPage() {
  const { documentId } = useParams({ from: '/peminjam/pinjam/$documentId/ringkasan' });
  const id = Number(documentId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [slotConflicts, setSlotConflicts] = useState<AvailabilityBatchSlot[]>([]);

  const documentQuery = useQuery({ queryKey: ['document', id], queryFn: () => documentService.getDocument(id) });
  const summaryQuery = useQuery({ queryKey: ['reservation-summary', id], queryFn: () => reservationService.summary(id) });

  const submit = useMutation({
    mutationFn: () => documentService.submitDocument(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      await queryClient.invalidateQueries({ queryKey: ['document', id] });
      await queryClient.invalidateQueries({ queryKey: ['reservation-summary', id] });
      await queryClient.invalidateQueries({ queryKey: ['room-bookings'] });
      toast.success('Peminjaman diajukan.');
      await navigate({ to: '/peminjam/pinjam/$documentId', params: { documentId } });
    },
    onError: async (error) => {
      setOpen(false);
      const status = getErrorStatus(error);
      const errors = (error as AxiosError<{ errors?: Record<string, unknown> }>).response?.data?.errors ?? {};
      if (status === 422 && 'missing' in errors) {
        setSubmitError('Masih ada field proposal yang kurang. Perbaiki di step proposal.');
        return;
      }
      if (status === 422 && 'proposal' in errors) {
        setSubmitError('Proposal belum lengkap.');
        return;
      }
      if (status === 422 && 'reservation_deadline' in errors) {
        setSubmitError('Reservasi sudah kedaluwarsa. Buat reservasi baru.');
        return;
      }
      if (status === 422 && 'slots' in errors) {
        const batch = await reservationService.checkAvailabilityBatch(documentQuery.data?.content?.slots ?? [], id);
        setSlotConflicts(batch.slots.filter((slot) => !slot.available));
        setSubmitError('Slot bentrok. Batalkan reservasi lalu buat baru.');
        return;
      }
      if (status === 400) {
        setSubmitError('Dokumen tidak dapat diproses. Muat ulang halaman.');
        return;
      }
      if (status === 403) {
        setSubmitError('Anda tidak berhak mengajukan dokumen ini.');
        return;
      }
      setSubmitError(getErrorMessage(error, 'Gagal mengajukan peminjaman.'));
    },
  });

  if (documentQuery.isLoading || summaryQuery.isLoading) return <p>Memuat…</p>;
  const document = documentQuery.data;
  const summary = summaryQuery.data;
  if (!document || !summary) return <p>Data tidak ditemukan.</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Ringkasan dan Pengajuan</h1>
      <ReservationSummaryCard document={document} summary={summary} />
      <Card>
        <CardHeader><CardTitle className="text-base">Kelengkapan proposal</CardTitle></CardHeader>
        <CardContent>
          {summary.completeness.is_complete ? (
            <p className="text-sm text-green-700">Proposal lengkap.</p>
          ) : (
            <ul className="list-disc pl-5 text-sm text-destructive">
              {missingLabels(summary.completeness.missing_fields).map((label) => <li key={label}>{label}</li>)}
            </ul>
          )}
        </CardContent>
      </Card>
      {submitError && <p className="text-sm text-destructive">{submitError}</p>}
      {slotConflicts.length > 0 && (
        <ul className="list-disc pl-5 text-sm text-destructive">
          {slotConflicts.map((slot) => <li key={slot.slot_index}>Slot #{slot.slot_index + 1} bentrok.</li>)}
        </ul>
      )}
      <Button disabled={!summary.completeness.is_complete || submit.isPending} onClick={() => setOpen(true)}>
        Ajukan Peminjaman
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajukan peminjaman?</DialogTitle>
            <DialogDescription>
              Slot akan dicek ulang terhadap bentrok. Setelah diajukan, jadwal tidak dapat diubah; pembatalan tersedia di halaman detail.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={() => submit.mutate()} disabled={submit.isPending}>Ya, ajukan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
