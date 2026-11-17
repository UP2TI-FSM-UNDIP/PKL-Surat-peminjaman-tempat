import { SelectGroup, SelectItem, SelectLabel } from '@/components/ui/select';
/** Bentuk minimal ruang (beberapa halaman memakai tipe Room yang berbeda). */
type RoomLike = { id: number | string; code: string; name: string; capacity?: number | null };

/** Kelompokkan ruang per gedung berdasarkan kode (A101 -> Gedung A). */
function groupByBuilding<T extends RoomLike>(rooms: T[]): Array<[string, T[]]> {
  const groups = new Map<string, T[]>();
  for (const room of rooms) {
    const match = /^([A-Z])\d{3}$/.exec(room.code);
    const group = match ? `Gedung ${match[1]}` : 'Ruang Lainnya';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(room);
  }
  // Gedung A, B, ... dulu, "Ruang Lainnya" di akhir
  return [...groups.entries()].sort(([a], [b]) =>
    a === 'Ruang Lainnya' ? 1 : b === 'Ruang Lainnya' ? -1 : a.localeCompare(b),
  );
}

/**
 * Isi dropdown ruang yang dikelompokkan per gedung. Pakai di dalam
 * <SelectContent position='popper' className='max-h-80'> agar daftar
 * panjang bisa digulir dengan jelas.
 */
export function RoomSelectOptions<T extends RoomLike>({
  rooms,
  getValue = (room: T) => String(room.id),
  getLabel = (room: T) => `${room.code} - ${room.name}`,
}: {
  rooms: T[];
  getValue?: (room: T) => string;
  getLabel?: (room: T) => string;
}) {

  return (
    <>
      {groupByBuilding(rooms).map(([group, items]) => (
        <SelectGroup key={group}>
          <SelectLabel className='text-xs font-semibold text-gray-500'>{group}</SelectLabel>
          {items.map((room) => (
            <SelectItem key={room.id} value={getValue(room)}>
              {getLabel(room)}
            </SelectItem>
          ))}
        </SelectGroup>
      ))}
    </>
  );
}
