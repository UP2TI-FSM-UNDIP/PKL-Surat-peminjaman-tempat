import { formatDateShort, formatTimeRange } from '@/lib/date';

/** Semua slot (tanggal · jam · ruang) dalam daftar ke bawah, urut waktu. */
export function SlotList({ slots }: { slots?: Array<{ room_id: number; room_code?: string | null; booking_date: string; start_time: string; end_time: string }> }) {
  if (!slots?.length) return <span className="text-muted-foreground">—</span>;
  const sorted = [...slots].sort((x, y) => `${x.booking_date}${x.start_time}`.localeCompare(`${y.booking_date}${y.start_time}`));
  return (
    <ul className="space-y-1">
      {sorted.map((slot, index) => (
        <li key={`${slot.room_id}-${slot.booking_date}-${index}`} className="flex items-center gap-2 whitespace-nowrap text-[13px]">
          <span className="w-[88px] shrink-0">{formatDateShort(slot.booking_date)}</span>
          <span className="w-[84px] shrink-0 text-muted-foreground tabular-nums">{formatTimeRange(slot.start_time, slot.end_time)}</span>
          <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium">{slot.room_code ?? 'Ruang'}</span>
        </li>
      ))}
    </ul>
  );
}
