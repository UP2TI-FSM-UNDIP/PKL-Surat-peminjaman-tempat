import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Room } from '@/services/room.service';

interface Props {
  rooms: Room[];
  value: number | null | undefined;
  onChange: (roomId: number) => void;
  id?: string;
  invalid?: boolean;
}

/** Gedung/kelompok dari kode ruang, mis. "A101" → "Gedung A", "AU-01" → "AU". */
function groupOf(room: Room): string {
  if (room.building) return room.building;
  const match = room.code.match(/^([A-Za-z]+)(?=\d)/);
  if (match) return `Gedung ${match[1].toUpperCase()}`;
  return 'Ruang khusus';
}

/** Pemilih ruang yang bisa dicari, dikelompokkan per gedung, menampilkan kapasitas. */
export function RoomPicker({ rooms, value, onChange, id, invalid }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = rooms.find((room) => room.id === value);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rooms.filter((room) =>
      !q || room.code.toLowerCase().includes(q) || room.name.toLowerCase().includes(q) || (room.location ?? '').toLowerCase().includes(q),
    );
    const map = new Map<string, Room[]>();
    filtered.forEach((room) => map.set(groupOf(room), [...(map.get(groupOf(room)) ?? []), room]));
    return [...map.entries()];
  }, [query, rooms]);

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(''); }}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-label="Ruang"
          aria-invalid={invalid || undefined}
          className={cn(
            'flex h-10 w-full items-center gap-2 rounded-xl border border-input bg-white px-3 text-left text-[14px] transition-colors hover:border-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
            invalid && 'border-destructive',
          )}
        >
          {selected ? (
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs font-semibold">{selected.code}</span>
              <span className="truncate">{selected.name}</span>
              {selected.capacity ? <span className="ml-auto shrink-0 text-xs text-muted-foreground">{selected.capacity} org</span> : null}
            </span>
          ) : (
            <span className="flex-1 text-muted-foreground">Pilih ruang</span>
          )}
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(92vw,420px)] p-0">
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari kode atau nama ruang…"
            className="h-10 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div role="listbox" aria-label="Daftar ruang" className="max-h-72 overflow-y-auto p-1">
          {groups.length === 0 && <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">Ruang tidak ditemukan.</p>}
          {groups.map(([group, items]) => (
            <div key={group} className="py-1">
              <p className="px-2 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{group}</p>
              {items.map((room) => {
                const isSelected = room.id === value;
                return (
                  <button
                    key={room.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => { onChange(room.id); setOpen(false); setQuery(''); }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] transition-colors hover:bg-muted',
                      isSelected && 'bg-accent text-accent-foreground',
                    )}
                  >
                    <span className="w-20 shrink-0 font-semibold">{room.code}</span>
                    <span className="min-w-0 flex-1 truncate">{room.name}</span>
                    {room.capacity ? (
                      <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground"><Users className="size-3" />{room.capacity}</span>
                    ) : null}
                    {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
