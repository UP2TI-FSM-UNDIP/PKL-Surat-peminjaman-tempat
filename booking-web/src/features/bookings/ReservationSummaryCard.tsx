import { formatTimeRange, formatDateShort } from '@/lib/date';
import type React from 'react';
import { ExternalLink } from 'lucide-react';
import { EquipmentTable } from '@/components/common/EquipmentTable';
import type { Document } from '@/types/document';
import type { ReservationContent, ReservationSummary } from '@/types/reservation';

/** Ringkasan reservasi bagi pengaju — tata letak sama dengan detail persetujuan. */
export function ReservationSummaryCard({ document, summary, onOpenProposal }: {
  document: Document<ReservationContent>;
  summary?: ReservationSummary;
  onOpenProposal?: () => void;
}) {
  const slots = summary?.slots ?? document.content?.slots ?? [];
  const equipment = summary?.equipment_items ?? document.content?.equipment_items ?? [];
  const rows: Array<[string, React.ReactNode]> = [
    ['Tujuan', document.content?.purpose || document.title],
    ['Ketua pelaksana', document.content?.ketua_pelaksana_nama || '—'],
    ['Peserta', document.content?.expected_participants ? `${document.content.expected_participants} orang` : '—'],
    ['Batas proposal', formatDateShort(summary?.reservation_deadline ?? document.reservation_deadline)],
    ['Buka sekat', document.content?.buka_sekat ? 'Ya' : 'Tidak'],
  ];

  return (
    <section className="space-y-6 rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-6">
      <div className="space-y-3">
        <h2 className="text-[17px] font-semibold tracking-tight">Jadwal</h2>
        <div className="space-y-2">
          {slots.map((slot, index) => {
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
        <EquipmentTable items={equipment} />
      </div>

      {onOpenProposal && (
        <button
          type="button"
          onClick={onOpenProposal}
          className="flex w-full items-center gap-3 rounded-xl bg-[#fdeeee]/60 p-3 text-left transition-colors hover:bg-[#fdeeee]"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#ff3b30] text-[10px] font-bold text-white">PDF</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold">Proposal kegiatan</span>
            <span className="block text-[13px] text-muted-foreground">Buka di tab baru</span>
          </span>
          <ExternalLink className="size-4 text-muted-foreground" />
        </button>
      )}
    </section>
  );
}
