import { Button } from '@/components/ui/button/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CalendarDocument, CalendarEvent } from '@/types/calendar';
import { CALENDAR_STATUS_META } from './calendarStatus';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tanggal yyyy-MM-dd. */
  date: string | null;
  /** Peminjaman aktif (hijau) pada tanggal tersebut. */
  events: CalendarEvent[];
  documents: Record<string, CalendarDocument>;
  onSelect: (event: CalendarEvent) => void;
}

const GREEN = CALENDAR_STATUS_META.active.color;

/** Semua peminjaman aktif dalam satu hari, ditampilkan sebagai tabel ala spreadsheet. */
export function DayBookingsModal({ open, onOpenChange, date, events, documents, onSelect }: Props) {
  if (!date) return null;

  const rows = [...events].sort(
    (a, b) => a.start_time.localeCompare(b.start_time) || a.room.code.localeCompare(b.room.code),
  );
  const rooms = new Set(rows.map((event) => event.room.code)).size;
  const label = new Date(`${date}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const th = 'sticky top-0 z-10 border-b border-r border-border bg-[#f5f5f7] px-3 py-2 text-left font-medium text-muted-foreground last:border-r-0';
  const td = 'border-b border-r border-border px-3 py-2 last:border-r-0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] grid-cols-[minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-5xl'>
        <div
          className='px-6 pt-6 pb-4'
          style={{ background: `linear-gradient(180deg, ${GREEN}1f 0%, ${GREEN}08 70%, transparent 100%)` }}
        >
          <DialogHeader className='space-y-2 text-left'>
            <span
              className='inline-flex w-fit items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold shadow-[0_1px_2px_rgb(0_0_0/0.06)]'
              style={{ color: GREEN }}
            >
              <span className='size-1.5 rounded-full' style={{ backgroundColor: GREEN }} />
              Peminjaman aktif
            </span>
            <DialogTitle className='pr-8 text-[22px] font-semibold leading-tight tracking-tight'>{label}</DialogTitle>
            <DialogDescription className='text-[13px]'>
              {rows.length} peminjaman · {rooms} ruang · klik baris untuk detail
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className='min-w-0 px-6 pb-6'>
          <div className='max-h-[60vh] overflow-auto rounded-xl border border-border'>
            <table className='w-full min-w-[720px] border-separate border-spacing-0 text-[13px]'>
              <thead>
                <tr>
                  <th className={`${th} w-10 text-center`}>#</th>
                  <th className={`${th} w-28`}>Jam</th>
                  <th className={th}>Ruang</th>
                  <th className={th}>Kegiatan</th>
                  <th className={th}>Peminjam</th>
                  <th className={`${th} w-20 text-right`}>Peserta</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((event, index) => {
                  const doc = documents[String(event.document_id)];
                  return (
                    <tr
                      key={event.id}
                      tabIndex={0}
                      onClick={() => onSelect(event)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelect(event);
                        }
                      }}
                      className={`cursor-pointer transition-colors hover:bg-[#ecf8ef] focus-visible:bg-[#ecf8ef] focus-visible:outline-none ${index % 2 ? 'bg-[#fafafb]' : 'bg-white'}`}
                    >
                      <td className={`${td} text-center text-muted-foreground tabular-nums`}>{index + 1}</td>
                      <td className={`${td} whitespace-nowrap tabular-nums`}>
                        {event.start_time.slice(0, 5)}–{event.end_time.slice(0, 5)}
                      </td>
                      <td className={td}>
                        <span className='whitespace-nowrap rounded-md bg-secondary px-2 py-0.5 text-xs font-medium'>{event.room.code}</span>
                      </td>
                      <td className={`${td} font-medium`}>{doc?.purpose || event.title || 'Tanpa judul'}</td>
                      <td className={td}>
                        {doc?.creator.name ?? '—'}
                        {doc?.creator.unit_code && <span className='text-muted-foreground'> · {doc.creator.unit_code}</span>}
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{doc?.expected_participants ?? '—'}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className='px-3 py-8 text-center text-muted-foreground'>Tidak ada peminjaman aktif.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <DialogFooter className='pt-4'>
            <Button variant='secondary' onClick={() => onOpenChange(false)}>Tutup</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
