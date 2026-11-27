import { formatDateShort } from '@/lib/date';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createFileRoute, Link, useNavigate, useParams } from '@tanstack/react-router';
import { useForm, useWatch } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Callout } from '@/components/ui/callout';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  const id = documentId;
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
      // Nama kegiatan sudah diisi saat reservasi; tinggal diperjelas bila perlu.
      event_name: content.event_name || content.purpose || '',
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
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-[28px]">Proposal Kegiatan</h1>
          <p className="text-sm text-muted-foreground">Jadwal reservasi sudah terkunci. Lengkapi proposal di bawah.</p>
        </div>
        <Link to="/peminjam/pinjam/$documentId" params={{ documentId }} className="text-sm underline">Lihat detail</Link>
      </div>

      <ReservationSummaryCard document={document} summary={summary} />

      {!editable ? (
        <Card>
          <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
            <p>Proposal tidak dapat diubah pada status {document.status}.</p>
            {summary?.reservation_deadline && <p>Batas proposal: {formatDateShort(summary.reservation_deadline)}</p>}
            {['REJECTED', 'EXPIRED', 'CANCELLED'].includes(document.status) && (
              <Link to="/peminjam/pinjam/baru"><Button>Buat reservasi baru</Button></Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit((values) => mutation.mutate(values))} onChange={() => setDirty(true)}>
          <section className={sectionClass}>
            <SectionTitle step={1} title="Detail kegiatan" description="Sesuai proposal kegiatan." />
            <div className="grid gap-x-4 gap-y-5 md:grid-cols-2">
              <ProposalField id="event_name" label="Nama kegiatan" error={errors.event_name?.message} className="md:col-span-2">
                <Input id="event_name" placeholder="Contoh: Seminar Nasional Matematika 2026" {...register('event_name', { required: 'Wajib diisi' })} />
              </ProposalField>
              <ProposalField id="event_nature" label="Sifat kegiatan" hint="Mis. akademik, non-akademik, internal">
                <Input id="event_nature" placeholder="Contoh: Akademik" {...register('event_nature')} />
              </ProposalField>
              <ProposalField id="event_form" label="Bentuk kegiatan" hint="Mis. seminar, rapat, lomba, workshop">
                <Input id="event_form" placeholder="Contoh: Seminar" {...register('event_form')} />
              </ProposalField>
              <ProposalField id="target_audience" label="Sasaran peserta" className="md:col-span-2">
                <Input id="target_audience" placeholder="Contoh: Mahasiswa FSM angkatan 2024" {...register('target_audience')} />
              </ProposalField>
              <ProposalField id="objectives" label="Tujuan kegiatan" error={errors.objectives?.message}>
                <Textarea id="objectives" rows={3} placeholder="Apa yang ingin dicapai dari kegiatan ini" {...register('objectives', { required: 'Wajib diisi' })} />
              </ProposalField>
              <ProposalField id="benefits" label="Manfaat">
                <Textarea id="benefits" rows={3} placeholder="Manfaat bagi peserta" {...register('benefits')} />
              </ProposalField>
            </div>
          </section>

          <section className={sectionClass}>
            <SectionTitle step={2} title="Kebutuhan alat" description="Opsional." />
            <EquipmentEditor control={control} />
          </section>

          <section className={sectionClass}>
            <SectionTitle step={3} title="Proposal PDF" description="PDF, maks. 20 MB." />
            <label
              htmlFor="proposal"
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-black/15 bg-muted/50 p-4 transition-colors hover:bg-muted"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#ff3b30] text-[10px] font-bold text-white">PDF</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">
                  {file ? file.name : document.file_proposal ? 'Proposal PDF tersimpan' : 'Pilih file proposal'}
                </span>
                <span className="block text-[13px] text-muted-foreground">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · akan diunggah saat disimpan` : 'Klik untuk memilih file PDF'}
                </span>
              </span>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[13px] font-medium ring-1 ring-black/[0.08]">{file || document.file_proposal ? 'Ganti' : 'Pilih'}</span>
            </label>
            <input id="proposal" aria-label="Proposal PDF (maks. 20 MB)" type="file" accept="application/pdf" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setDirty(true); }} />
          </section>

          {summary && !summary.completeness.is_complete && (
            <Callout tone="warning" title="Yang belum lengkap">
              <ul className="list-disc space-y-0.5 pl-4">
                {missingLabels(summary.completeness.missing_fields).map((label) => <li key={label}>{label}</li>)}
              </ul>
            </Callout>
          )}

          <section className={`${sectionClass} sm:flex sm:items-center sm:justify-between sm:gap-6 sm:space-y-0`}>
            <p className="text-[13px] text-muted-foreground">
              {equipment.length} alat · simpan draf kapan saja, lalu lanjut ke ringkasan untuk mengajukan.
            </p>
            <div className="flex shrink-0 gap-2">
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
          </section>
        </form>
      )}
    </div>
  );
}

const sectionClass = 'space-y-5 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-6';

function SectionTitle({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-white">{step}</span>
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight sm:text-[17px]">{title}</h2>
        <p className="text-xs text-muted-foreground sm:text-[13px]">{description}</p>
      </div>
    </div>
  );
}

function ProposalField({ id, label, hint, error, className, children }: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ''}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
