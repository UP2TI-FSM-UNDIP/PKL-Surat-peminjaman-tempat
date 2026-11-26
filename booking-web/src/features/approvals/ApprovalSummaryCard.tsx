import { formatTimeRange, formatDateShort } from '@/lib/date';
import type React from 'react';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { EquipmentTable } from '@/components/common/EquipmentTable';
import { fileService } from '@/services/file.service';
import { getErrorMessage } from '@/lib/errors';
import type { Document } from '@/types/document';
import type { ReservationContent, ReservationSummary } from '@/types/reservation';

export function ApprovalSummaryCard({ document, summary }: {
  document: Document<ReservationContent>;
  summary: ReservationSummary;
}) {
  const openProposal = async () => {
    const tab = window.open('', '_blank');
    if (!tab) {
      toast.error('Popup diblokir. Izinkan popup untuk melihat proposal.');
      return;
    }
    tab.opener = null;
    try {
      const { objectUrl } = await fileService.fetchBlobUrl(`/documents/${document.id}/file/proposal`);
      tab.location.href = objectUrl;
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      tab.close();
      toast.error(getErrorMessage(error, 'Proposal tidak dapat dibuka.'));
    }
  };

  const rows: Array<[string, React.ReactNode]> = [
    ['Pemohon', document.creator?.name ?? document.creator_id],
    ['Unit', document.unit?.name ?? '—'],
    ['Tujuan', document.content?.purpose || '—'],
    ['Ketua pelaksana', document.content?.ketua_pelaksana_nama || '—'],
    ['Peserta', document.content?.expected_participants ? `${document.content.expected_participants} orang` : '—'],
    ['Batas proposal', formatDateShort(summary.reservation_deadline)],
    ['Buka sekat', document.content?.buka_sekat ? 'Ya' : 'Tidak'],
  ];

  return (
    <section className="space-y-6 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-6">
      <div className="space-y-3">
        <h2 className="text-[17px] font-semibold tracking-tight">Jadwal</h2>
        <div className="space-y-2">
          {summary.slots.map((slot, index) => {
            const date = new Date(`${slot.booking_date}T00:00:00`);
            return (
              <div key={`${slot.room_id}-${slot.booking_date}-${index}`} className="flex items-center gap-3 rounded-xl bg-muted/70 p-3">
                <div className="flex w-12 shrink-0 flex-col items-center overflow-hidden rounded-lg bg-white ring-1 ring-black/[0.06]">
                  <span className="w-full bg-primary py-0.5 text-center text-[9px] font-semibold uppercase tracking-wide text-white">
                    {date.toLocaleDateString('id-ID', { month: 'short' }).replace('.', '')}
                  </span>
                  <span className="py-0.5 text-lg font-semibold leading-tight tabular-nums">{date.getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">{slot.room_code ?? slot.room_name ?? slot.room_id}<span className="font-normal text-muted-foreground">{slot.room_name && slot.room_code ? ` · ${slot.room_name}` : ''}</span></p>
                  <p className="text-[13px] text-muted-foreground">
                    {date.toLocaleDateString('id-ID', { weekday: 'long' })} · {formatTimeRange(slot.start_time, slot.end_time)} WIB
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-[17px] font-semibold tracking-tight">Detail pengajuan</h2>
        <dl className="divide-y divide-border overflow-hidden rounded-xl ring-1 ring-black/[0.06]">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 px-4 py-3">
              <dt className="shrink-0 text-[13px] text-muted-foreground">{label}</dt>
              <dd className="text-right text-[14px] font-medium break-words">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="space-y-3">
        <h2 className="text-[17px] font-semibold tracking-tight">Kebutuhan alat</h2>
        <EquipmentTable items={summary.equipment_items} />
      </div>

      <button
        type="button"
        onClick={openProposal}
        className="flex w-full items-center gap-3 rounded-xl bg-[#fdeeee]/60 p-3 text-left transition-colors hover:bg-[#fdeeee]"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#ff3b30] text-[10px] font-bold text-white">PDF</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold">Proposal kegiatan</span>
          <span className="block text-[13px] text-muted-foreground">Buka di tab baru</span>
        </span>
        <ExternalLink className="size-4 text-muted-foreground" />
      </button>
    </section>
  );
}
