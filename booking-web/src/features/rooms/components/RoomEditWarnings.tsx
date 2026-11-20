import type { Room } from '@/services/room.service';

// Samakan dengan SpecialRoomsSeeder::VENUES.
const SEED_CODES = [
  'F104',
  'F107',
  'F202',
  'AU-01',
  'RR-A01',
  'RS-B01',
  'PENDOPO-FSM',
  'STUDIO-FSM',
];

interface RoomEditWarningsProps {
  upcomingBookingCount: number;
  status: Room['status'];
  originalCode: string;
  currentCode: string;
}

export function RoomEditWarnings({
  upcomingBookingCount,
  status,
  originalCode,
  currentCode,
}: RoomEditWarningsProps) {
  return (
    <>
      {upcomingBookingCount > 0 && status !== 'ACTIVE' && (
        <p className='rounded border border-yellow-200 bg-yellow-50 p-2 text-sm text-yellow-800'>
          Ruang ini punya {upcomingBookingCount} booking mendatang. Status
          Maintenance/Nonaktif tidak membatalkan booking tersebut.
        </p>
      )}
      {SEED_CODES.includes(originalCode) && currentCode !== originalCode && (
        <p className='rounded border border-yellow-200 bg-yellow-50 p-2 text-sm text-yellow-800'>
          Mengubah kode ruang seed membuat seeder tidak mengenali baris ini pada
          run berikutnya.
        </p>
      )}
    </>
  );
}
