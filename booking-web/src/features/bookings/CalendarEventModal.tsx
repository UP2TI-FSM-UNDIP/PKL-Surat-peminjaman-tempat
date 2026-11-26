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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { authService } from '@/services/auth.service';
import type { CalendarDocument, CalendarEvent } from '@/types/calendar';
import { CALENDAR_STATUS_META, TERMINAL_STATUSES } from './calendarStatus';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
  document?: CalendarDocument;
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function InfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-md border bg-gray-50/80 p-3 ${className ?? ''}`}>
      <p className='text-xs text-gray-500'>{label}</p>
      <p className='text-sm font-semibold text-gray-900 break-words'>
        {value ?? '-'}
      </p>
    </div>
  );
}

export function CalendarEventModal({ open, onOpenChange, event, document }: Props) {
  const navigate = useNavigate();

  if (!event) return null;

  const meta = CALENDAR_STATUS_META[event.display_status];
  const currentUserId = Number(authStorage.getItem('userId') ?? 0);
  const roleSlug = authService.getRoleSlug();
  const canBorrow = roleSlug === 'peminjam' || roleSlug === 'dosen';
  const canCompleteProposal =
    event.display_status === 'reservation' &&
    !!document &&
    document.creator.id === currentUserId &&
    canBorrow;
  const canCreateNew = TERMINAL_STATUSES.includes(event.display_status) && canBorrow;

  const reasonTone =
    event.display_status === 'rejected'
      ? 'border-red-200 bg-red-50 text-red-800'
      : event.display_status === 'expired'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-gray-200 bg-gray-50 text-gray-700';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
        <DialogHeader>
          <div className='flex flex-wrap items-center gap-2'>
            <DialogTitle className='text-xl'>{event.title}</DialogTitle>
            <span
              className='inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white'
              style={{ backgroundColor: meta.color }}
            >
              {event.status_label}
            </span>
          </div>
          <DialogDescription>
            Ringkasan reservasi dan seluruh slot dokumen.
          </DialogDescription>
        </DialogHeader>

        {!document && (
          <p className='rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800'>
            Ringkasan dokumen tidak tersedia.
          </p>
        )}

        <div className='grid gap-3 sm:grid-cols-2'>
          <InfoRow label='Tujuan / Kegiatan' value={document?.purpose ?? '-'} className='sm:col-span-2' />
          <InfoRow label='Tanggal' value={formatDate(event.booking_date)} />
          <InfoRow label='Waktu' value={`${event.start_time}–${event.end_time}`} />
          <InfoRow label='Ruangan' value={`${event.room.code} — ${event.room.name}`} />
          <InfoRow
            label='Peminjam'
            value={
              document
                ? `${document.creator.name}${document.creator.unit_code ? ` (${document.creator.unit_code})` : ''}`
                : '-'
            }
          />
          <InfoRow
            label='Jumlah Peserta'
            value={
              document?.expected_participants === null || document?.expected_participants === undefined
                ? '-'
                : `${document.expected_participants} orang`
            }
          />
          <InfoRow label='Batas Proposal' value={document?.reservation_deadline ?? '-'} />
          <InfoRow label='Buka Sekat' value={document ? (document.buka_sekat ? 'Ya' : 'Tidak') : '-'} />
        </div>

        {TERMINAL_STATUSES.includes(event.display_status) && (
          <div className={`rounded-md border p-3 text-sm ${reasonTone}`}>
            <p className='font-medium'>Alasan</p>
            <p>{event.status_reason ?? 'Tidak ada catatan alasan.'}</p>
          </div>
        )}

        <div>
          <h3 className='mb-2 text-sm font-semibold'>Slot reservasi</h3>
          {document && document.slots.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ruang</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jam</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {document.slots.map((slot, index) => (
                  <TableRow key={`${slot.room_id}-${slot.booking_date}-${index}`}>
                    <TableCell>
                      {slot.room_code ?? slot.room_name ?? slot.room_id}
                    </TableCell>
                    <TableCell>{formatDate(slot.booking_date)}</TableCell>
                    <TableCell>
                      {slot.start_time}–{slot.end_time}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className='text-sm text-gray-500'>Ringkasan slot tidak tersedia.</p>
          )}
        </div>

        <div>
          <h3 className='mb-2 text-sm font-semibold'>Kebutuhan alat</h3>
          {document && document.equipment_items.length > 0 ? (
            <ul className='list-disc pl-5 text-sm'>
              {document.equipment_items.map((item) => (
                <li key={item.nama}>
                  {item.nama} × {item.jumlah}
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-sm text-gray-500'>Tidak ada kebutuhan alat</p>
          )}
        </div>

        <DialogFooter className='gap-2 border-t pt-4'>
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
              Lengkapi Pengajuan
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
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
