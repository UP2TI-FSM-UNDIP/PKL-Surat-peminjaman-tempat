import { formatTimeRange, formatDateShort } from '@/lib/date';
import { EquipmentTable } from '@/components/common/EquipmentTable';
import { authStorage } from '@/lib/authStorage';
import { useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Callout } from '@/components/ui/callout';
import { Clock, Columns2, Hourglass, Table2, User, Users } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { canBorrow as canBorrowRole } from '@/lib/borrowerRoles';
import type { CalendarDocument, CalendarEvent } from '@/types/calendar';
import { CALENDAR_STATUS_META, TERMINAL_STATUSES } from './calendarStatus';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  document?: CalendarDocument;
  /** Jumlah peminjaman aktif (hijau) pada tanggal event ini. */
  dayActiveCount?: number;
  onShowDay?: () => void;
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function DetailRow({
  icon,
  label,
  value,
  tint,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  tint: string;
}) {
  return (
    <div className='flex items-center gap-3 px-4 py-3'>
      <span className={`flex size-8 shrink-0 items-center justify-center rounded-full ${tint}`}>{icon}</span>
      <span className='min-w-0 flex-1 text-[13px] text-muted-foreground'>{label}</span>
      <span className='max-w-[60%] text-right text-[14px] font-medium text-foreground break-words'>{value ?? '—'}</span>
    </div>
  );
}

export function CalendarEventModal({ open, onOpenChange, event, document, dayActiveCount = 0, onShowDay }: Props) {
  const navigate = useNavigate();

  if (!event) return null;

  const meta = CALENDAR_STATUS_META[event.display_status];
  const currentUserId = Number(authStorage.getItem('userId') ?? 0);
  const roleSlug = authService.getRoleSlug();
  const canBorrow = canBorrowRole(roleSlug);
  const canCompleteProposal =
    event.display_status === 'reservation' &&
    !!document &&
    document.creator.id === currentUserId &&
    canBorrow;
  const canCreateNew = TERMINAL_STATUSES.includes(event.display_status) && canBorrow;

  const date = new Date(`${event.booking_date}T00:00:00`);
  const monthShort = date.toLocaleDateString('id-ID', { month: 'short' }).replace('.', '');
  const dayNumber = date.getDate();
  const reasonTone = event.display_status === 'rejected' ? 'danger' : event.display_status === 'expired' ? 'warning' : 'info';
  const otherSlots = document?.slots ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] gap-0 overflow-y-auto p-0 sm:max-w-2xl'>
        {/* Header bernuansa warna status */}
        <div
          className='px-6 pt-6 pb-5'
          style={{ background: `linear-gradient(180deg, ${meta.color}1f 0%, ${meta.color}08 70%, transparent 100%)` }}
        >
          <DialogHeader className='space-y-3 text-left'>
            <span
              className='inline-flex w-fit items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold shadow-[0_1px_2px_rgb(0_0_0/0.06)]'
              style={{ color: meta.color }}
            >
              <span className='size-1.5 rounded-full' style={{ backgroundColor: meta.color }} />
              {event.status_label}
            </span>
            <DialogTitle className='pr-8 text-[22px] font-semibold leading-tight tracking-tight'>
              {document?.purpose || event.title}
            </DialogTitle>
            <DialogDescription className='text-[13px]'>
              {event.room.code} · {event.room.name}
            </DialogDescription>
          </DialogHeader>

          <div className='mt-5 flex items-center gap-4 rounded-2xl bg-white p-3 shadow-[0_1px_3px_rgb(0_0_0/0.06)] ring-1 ring-black/[0.04]'>
            <div className='flex w-14 shrink-0 flex-col items-center overflow-hidden rounded-xl ring-1 ring-black/[0.06]'>
              <span className='w-full py-0.5 text-center text-[10px] font-semibold uppercase tracking-wide text-white' style={{ backgroundColor: meta.color }}>
                {monthShort}
              </span>
              <span className='py-1 text-xl font-semibold leading-none tabular-nums'>{dayNumber}</span>
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-[15px] font-semibold'>{formatDate(event.booking_date)}</p>
              <p className='flex items-center gap-1.5 text-[13px] text-muted-foreground'>
                <Clock className='size-3.5' /> {formatTimeRange(event.start_time, event.end_time)} WIB
              </p>
            </div>
            {event.display_status === 'active' && onShowDay && dayActiveCount > 1 && (
              <button
                type='button'
                onClick={onShowDay}
                className='inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#ecf8ef] px-3 py-1.5 text-[13px] font-medium text-[#248a3d] transition-colors hover:bg-[#dcf2e2]'
              >
                <Table2 className='size-3.5' />
                <span className='hidden sm:inline'>Semua hari ini</span>
                <span className='rounded-full bg-white px-1.5 text-xs tabular-nums'>{dayActiveCount}</span>
              </button>
            )}
          </div>
        </div>

        <div className='space-y-5 px-6 pb-6'>
          {!document && <Callout tone='info'>Ringkasan dokumen tidak tersedia.</Callout>}

          {TERMINAL_STATUSES.includes(event.display_status) && (
            <Callout tone={reasonTone} title='Alasan'>
              {event.status_reason ?? 'Tidak ada catatan alasan.'}
            </Callout>
          )}

          <div className='divide-y divide-border overflow-hidden rounded-2xl bg-muted/60'>
            <DetailRow
              icon={<User className='size-4' />}
              tint='bg-[#eaf3fe] text-primary'
              label='Peminjam'
              value={document ? `${document.creator.name}${document.creator.unit_code ? ` · ${document.creator.unit_code}` : ''}` : '—'}
            />
            <DetailRow
              icon={<Users className='size-4' />}
              tint='bg-[#ecf8ef] text-[#248a3d]'
              label='Peserta'
              value={document?.expected_participants == null ? '—' : `${document.expected_participants} orang`}
            />
            <DetailRow
              icon={<Hourglass className='size-4' />}
              tint='bg-[#fff4e5] text-[#c77700]'
              label='Batas proposal'
              value={formatDateShort(document?.reservation_deadline)}
            />
            <DetailRow
              icon={<Columns2 className='size-4' />}
              tint='bg-[#f3eefc] text-[#8944ab]'
              label='Buka sekat'
              value={document ? (document.buka_sekat ? 'Ya' : 'Tidak') : '—'}
            />
          </div>

          {event.display_status === 'reservation' && (
            <div className='flex gap-3 rounded-xl bg-[#fff0f6] px-4 py-3 text-[13px] leading-5 text-[#7a1f45]'>
              <span className='mt-1 size-2 shrink-0 rounded-full bg-[#ec4899]' />
              <div>
                <p className='font-semibold'>Proposal belum lengkap</p>
                <p className='opacity-90'>
                  Slot masih ditahan sebagai reservasi. Proposal harus dilengkapi sebelum{' '}
                  <span className='font-semibold'>{formatDateShort(document?.reservation_deadline)}</span>, jika tidak reservasi batal otomatis.
                </p>
              </div>
            </div>
          )}

          {otherSlots.length > 0 && event.display_status !== 'reservation' && (
            <div className='space-y-2'>
              <div className='flex items-baseline justify-between'>
                <h3 className='text-[13px] font-semibold text-muted-foreground'>Rangkuman slot</h3>
                <span className='text-xs text-muted-foreground'>{otherSlots.length} baris</span>
              </div>
              <div className='overflow-x-auto rounded-xl ring-1 ring-black/[0.08]'>
                <table className='w-full border-collapse text-[13px] tabular-nums'>
                  <thead>
                    <tr className='bg-[#f2f2f5] text-left text-xs text-muted-foreground'>
                      <th className='w-10 border-r border-b border-border px-3 py-2 text-center font-medium'>#</th>
                      <th className='border-r border-b border-border px-3 py-2 font-medium'>Ruang</th>
                      <th className='border-r border-b border-border px-3 py-2 font-medium'>Tanggal</th>
                      <th className='border-r border-b border-border px-3 py-2 font-medium'>Mulai</th>
                      <th className='border-b border-border px-3 py-2 font-medium'>Selesai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {otherSlots.map((slot, index) => {
                      const isCurrent = slot.booking_date === event.booking_date && slot.start_time.slice(0, 5) === event.start_time.slice(0, 5) && (slot.room_code ?? '') === event.room.code;
                      return (
                        <tr key={`${slot.room_id}-${slot.booking_date}-${index}`} className={isCurrent ? 'bg-[#ecf8ef]' : index % 2 ? 'bg-[#fafafb]' : 'bg-white'}>
                          <td className='border-r border-b border-border px-3 py-2 text-center text-muted-foreground'>{index + 1}</td>
                          <td className='border-r border-b border-border px-3 py-2 font-medium'>
                            {slot.room_code ?? slot.room_name ?? slot.room_id}
                            {isCurrent && <span className='ml-2 rounded-full bg-[#34c759] px-1.5 py-px text-[10px] font-semibold text-white'>dipilih</span>}
                          </td>
                          <td className='border-r border-b border-border px-3 py-2'>{formatDateShort(slot.booking_date)}</td>
                          <td className='border-r border-b border-border px-3 py-2'>{slot.start_time.slice(0, 5)}</td>
                          <td className='border-b border-border px-3 py-2'>{slot.end_time.slice(0, 5)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className='space-y-2'>
            <h3 className='text-[13px] font-semibold text-muted-foreground'>Kebutuhan alat</h3>
            <EquipmentTable items={document?.equipment_items ?? []} />
          </div>

          <DialogFooter className='flex-col-reverse gap-2 pt-1 sm:flex-row'>
            <Button variant='secondary' onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
            {canCompleteProposal && document && (
              <Button
                onClick={() => {
                  navigate({
                    to: '/peminjam/pinjam/$documentId/proposal',
                    params: { documentId: String(document.id) },
                  });
                  onOpenChange(false);
                }}
              >
                Lengkapi pengajuan
              </Button>
            )}
            {canCreateNew && (
              <Button
                onClick={() => {
                  navigate({ to: '/peminjam/pinjam/baru' });
                  onOpenChange(false);
                }}
              >
                Buat reservasi baru
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
