import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { EquipmentTable } from '@/components/common/EquipmentTable';
import { documentService } from '@/services/document.service';
import { getErrorMessage } from '@/lib/errors';
import { formatDateShort, formatTimeRange } from '@/lib/date';
import { documentKey, type Document } from '@/types/document';
import type { ReservationContent, ReservationSummary } from '@/types/reservation';

export const detailPanel = 'rounded-2xl border border-black/[0.06] bg-white p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:p-5';

const MODE_LABEL: Record<string, string> = {
  one_room_many_dates: '1 ruang, banyak tanggal',
  one_date_many_rooms: '1 tanggal, banyak ruang',
};

function Title({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-[14px] font-semibold tracking-tight sm:text-[15px]">{children}</h2>
      {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
    </div>
  );
}

function Fields({ rows }: { rows: Array<[string, ReactNode, boolean?]> }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
      {rows.map(([label, value, wide]) => (
        <div key={label} className={`min-w-0 ${wide ? 'col-span-2 sm:col-span-3' : ''}`}>
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
          <dd className="mt-0.5 text-[13px] font-medium break-words whitespace-pre-line sm:text-[14px]">{value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Detail lengkap pengajuan (semua isian form) dalam tata letak ringkas, dipakai semua role. */
export function ReservationDetail({ document, summary }: {
  document: Document<ReservationContent>;
  summary: ReservationSummary;
}) {
  const c = document.content ?? {};

  const openProposal = async () => {
    const tab = window.open('', '_blank');
    if (!tab) {
      toast.error('Popup diblokir. Izinkan popup untuk melihat proposal.');
      return;
    }
    tab.opener = null;
    try {
      const { objectUrl } = await documentService.fetchFileUrl(documentKey(document));
      tab.location.href = objectUrl;
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      tab.close();
      toast.error(getErrorMessage(error, 'Proposal tidak dapat dibuka.'));
    }
  };

  return (
    <div className="space-y-4">
      <section className={detailPanel}>
        <Title aside={`${summary.slots.length} slot · ${MODE_LABEL[c.mode ?? ''] ?? '—'}`}>Jadwal</Title>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="py-1.5 pr-3 font-medium">Tanggal</th>
                <th className="py-1.5 pr-3 font-medium">Jam</th>
                <th className="py-1.5 font-medium">Ruang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {summary.slots.map((slot, index) => (
                <tr key={`${slot.room_id}-${slot.booking_date}-${index}`}>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {new Date(`${slot.booking_date}T00:00:00`).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap tabular-nums">{formatTimeRange(slot.start_time, slot.end_time)}</td>
                  <td className="py-2">
                    <span className="font-semibold">{slot.room_code ?? slot.room_name}</span>
                    {slot.room_code && slot.room_name && <span className="text-muted-foreground"> · {slot.room_name}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={detailPanel}>
        <Title>Data peminjam</Title>
        <Fields
          rows={[
            ['Pemohon', document.creator?.name],
            ['Unit', document.unit?.name],
            ['Diajukan', formatDateShort(document.created_at)],
            ['Tujuan / nama kegiatan', c.purpose, true],
            ['Ketua pelaksana', c.ketua_pelaksana_nama],
            ['NIM/NIP/NIDN', c.ketua_pelaksana_identitas],
            ['Nomor HP', c.ketua_pelaksana_hp],
            ['Perkiraan peserta', c.expected_participants ? `${c.expected_participants} orang` : null],
            ['Buka sekat', c.buka_sekat ? 'Ya' : 'Tidak'],
            ['Batas proposal', summary.reservation_deadline ? formatDateShort(summary.reservation_deadline) : null],
          ]}
        />
      </section>

      <section className={detailPanel}>
        <Title>Proposal kegiatan</Title>
        <Fields
          rows={[
            ['Nama kegiatan', c.event_name, true],
            ['Sifat', c.event_nature],
            ['Bentuk', c.event_form],
            ['Sasaran peserta', c.target_audience],
            ['Tujuan', c.objectives, true],
            ['Manfaat', c.benefits, true],
          ]}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-start">
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Kebutuhan alat</p>
            <EquipmentTable items={summary.equipment_items} />
          </div>
          {document.file_proposal ? (
            <button
              type="button"
              onClick={openProposal}
              className="flex items-center gap-2.5 rounded-xl bg-[#fdeeee]/60 p-2.5 text-left transition-colors hover:bg-[#fdeeee]"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#ff3b30] text-[9px] font-bold text-white">PDF</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold">Proposal PDF</span>
                <span className="block text-xs text-muted-foreground">Buka di tab baru</span>
              </span>
              <ExternalLink className="size-3.5 text-muted-foreground" />
            </button>
          ) : (
            <p className="rounded-xl bg-muted/70 p-2.5 text-[13px] text-muted-foreground">Proposal PDF belum diunggah.</p>
          )}
        </div>
      </section>
    </div>
  );
}
