import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router';
import { useForm, useWatch } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { documentService } from '@/services/document.service';
import { reservationService } from '@/services/reservation.service';
import { buildProposalFormData } from '@/lib/proposalForm';
import { missingLabels } from '@/lib/completeness';
import { getErrorMessage } from '@/lib/errors';
import { EquipmentEditor } from '@/features/bookings/EquipmentEditor';
import { ReservationSummaryCard } from '@/features/bookings/ReservationSummaryCard';
import type { ReservationContent } from '@/types/reservation';
import type { ProposalFormValues } from '@/features/bookings/proposalForm.types';

export const Route = createFileRoute('/peminjam/pinjam/$documentId/proposal')({ component: ProposalPage });

function ProposalPage() {
  const { documentId } = useParams({ from: '/peminjam/pinjam/$documentId/proposal' });
  const id = Number(documentId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [dirty, setDirty] = useState(false);
  const hydratedDocumentId = useRef<number | null>(null);

  const documentQuery = useQuery({ queryKey: ['document', id], queryFn: () => documentService.getDocument(id) });
  const summaryQuery = useQuery({ queryKey: ['reservation-summary', id], queryFn: () => reservationService.summary(id) });
  const document = documentQuery.data;
  const summary = summaryQuery.data;
  const editable = document?.status === 'DRAFT' || document?.status === 'REVISION';

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ProposalFormValues>({
    defaultValues: { event_name: '', event_nature: '', event_form: '', objectives: '', benefits: '', target_audience: '', equipment_items: [] },
  });
  const equipment = useWatch({ control, name: 'equipment_items' }) ?? [];

  useLayoutEffect(() => {
    if (!document || hydratedDocumentId.current === document.id) return;
    const content = document.content as ReservationContent | undefined;
    if (!content) return;
    hydratedDocumentId.current = document.id;
    reset({
      event_name: content.event_name ?? '',
      event_nature: content.event_nature ?? '',
      event_form: content.event_form ?? '',
      objectives: content.objectives ?? '',
      benefits: content.benefits ?? '',
      target_audience: content.target_audience ?? '',
      equipment_items: content.equipment_items ?? [],
    });
  }, [document, reset]);

  useEffect(() => {
    const warning = (event: BeforeUnloadEvent) => {
      if (dirty) event.preventDefault();
    };
    window.addEventListener('beforeunload', warning);
    return () => window.removeEventListener('beforeunload', warning);
  }, [dirty]);

  const mutation = useMutation({
    mutationFn: (values: ProposalFormValues) => reservationService.updateProposal(id, buildProposalFormData({
      content: { ...values, equipment_items: values.equipment_items.filter((item) => item.nama.trim() && item.jumlah > 0) },
      proposal: file,
    })),
    onSuccess: async () => {
      setDirty(false);
      setFile(null);
      await queryClient.invalidateQueries({ queryKey: ['document', id] });
      await queryClient.invalidateQueries({ queryKey: ['reservation-summary', id] });
      toast.success('Proposal disimpan.');
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Gagal menyimpan proposal.')),
  });

  if (documentQuery.isLoading || summaryQuery.isLoading) return <p className="text-sm text-muted-foreground">Memuat…</p>;
  if (!document) return <p className="text-sm text-destructive">Dokumen tidak ditemukan.</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Proposal Kegiatan</h1>
          <p className="text-sm text-muted-foreground">Jadwal reservasi sudah terkunci. Lengkapi proposal di bawah.</p>
        </div>
        <Link to="/peminjam/pinjam/$documentId" params={{ documentId }} className="text-sm underline">Lihat detail</Link>
      </div>

      <ReservationSummaryCard document={document} summary={summary} />

      {!editable ? (
        <Card>
          <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
            <p>Proposal tidak dapat diubah pada status {document.status}.</p>
            {summary?.reservation_deadline && <p>Deadline: {summary.reservation_deadline}</p>}
            {['REJECTED', 'EXPIRED', 'CANCELLED'].includes(document.status) && (
              <Link to="/peminjam/pinjam/baru"><Button>Buat reservasi baru</Button></Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))} onChange={() => setDirty(true)}>
          <div className="grid gap-4 md:grid-cols-2">
            {(['event_name', 'event_nature', 'event_form', 'objectives', 'benefits', 'target_audience'] as const).map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{key === 'event_name' ? 'Nama kegiatan' : key === 'event_nature' ? 'Sifat kegiatan' : key === 'event_form' ? 'Bentuk kegiatan' : key === 'objectives' ? 'Tujuan' : key === 'benefits' ? 'Manfaat' : 'Sasaran peserta'}</Label>
                <Input id={key} {...register(key, { required: ['event_name', 'objectives'].includes(key) ? 'Wajib diisi' : false })} />
                {errors[key] && <p className="text-xs text-destructive">{errors[key]?.message}</p>}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Kebutuhan alat</Label>
            <EquipmentEditor control={control} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposal">Proposal PDF (maks. 20 MB)</Label>
            <Input id="proposal" type="file" accept="application/pdf" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setDirty(true); }} />
            <p className="text-xs text-muted-foreground">{file ? file.name : document.file_proposal ? 'Proposal PDF tersimpan' : 'Belum ada file'}</p>
          </div>

          {summary && !summary.completeness.is_complete && (
            <Card>
              <CardHeader><CardTitle className="text-base">Yang belum lengkap</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 text-sm">
                  {missingLabels(summary.completeness.missing_fields).map((label) => <li key={label}>{label}</li>)}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2">
            <Button type="submit" variant="outline" disabled={mutation.isPending}>Simpan draf</Button>
            <Button
              type="button"
              disabled={mutation.isPending}
              onClick={handleSubmit(async (values) => {
                try {
                  await mutation.mutateAsync(values);
                  const fresh = await reservationService.summary(id);
                  if (!fresh.completeness.is_complete) {
                    toast.error('Proposal belum lengkap.');
                    return;
                  }
                  await navigate({ to: '/peminjam/pinjam/$documentId/ringkasan', params: { documentId } });
                } catch {
                  return;
                }
              })}
            >
              Lanjut ke ringkasan
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{equipment.length} baris alat</p>
        </form>
      )}
    </div>
  );
}
