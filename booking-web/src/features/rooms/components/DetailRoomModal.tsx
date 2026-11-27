import { Button } from '@/components/ui/button/button';
import { Camera } from 'lucide-react';
import { DetailGrid, FormDialog } from '@/components/common/FormDialog';
import type { Room } from '@/services/room.service';

interface DetailRoomModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS = {
  ACTIVE: ['Aktif', 'bg-[#e8f8ee] text-[#1f8a4c]'],
  MAINTENANCE: ['Maintenance', 'bg-[#fff4e0] text-[#a05a00]'],
  INACTIVE: ['Nonaktif', 'bg-[#fdeeee] text-destructive'],
} as const;

export function DetailRoomModal({ room, isOpen, onClose }: DetailRoomModalProps) {
  if (!room) return null;
  const [statusLabel, statusClass] = STATUS[room.status] ?? STATUS.INACTIVE;
  const images = room.images ?? [];

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={room.name}
      description={room.code}
      size='md'
      footer={<Button onClick={onClose}>Tutup</Button>}
    >
      <div className='space-y-4'>
        {images.length > 0 ? (
          <div className='-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1'>
            {images.map((path, idx) => (
              <img
                key={path}
                src={`${import.meta.env.VITE_API_URL}/rooms/${room.id}/image?path=${encodeURIComponent(path)}`}
                alt={`${room.name} ${idx + 1}`}
                className={`aspect-video shrink-0 snap-center rounded-xl bg-muted object-cover ${images.length === 1 ? 'w-full' : 'w-4/5 sm:w-72'}`}
              />
            ))}
          </div>
        ) : (
          <div className='flex h-24 items-center justify-center gap-2 rounded-xl bg-muted/60 text-[13px] text-muted-foreground'>
            <Camera className='size-4 opacity-50' /> Belum ada foto
          </div>
        )}

        <DetailGrid
          items={[
            ['Kapasitas', room.capacity ? `${room.capacity} orang` : 'Tanpa batas'],
            ['Status', <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>{statusLabel}</span>],
            ['Tipe', room.type],
            ['Senin–Jumat', room.is_bookable_weekday ? `Bisa, s.d. ${room.weekday_max_end_time?.slice(0, 5) ?? '16:30'}` : 'Tidak (akhir pekan saja)'],
            ['Deskripsi', room.description, true],
          ]}
        />

        {room.facilities && room.facilities.length > 0 && (
          <div className='border-t border-black/[0.06] pt-4'>
            <h3 className='mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>Fasilitas</h3>
            <div className='flex flex-wrap gap-1.5'>
              {room.facilities.map((facility) => (
                <span key={facility} className='rounded-full bg-muted px-2.5 py-1 text-xs font-medium'>
                  {facility}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </FormDialog>
  );
}
