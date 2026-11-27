import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field } from '@/components/common/FormDialog';
import { roomService, type Room } from '@/services/room.service';
import { cn } from '@/lib/utils';

const NONE = '__none';
const NEW = '__new';

interface Props {
  /** Ruang yang sedang diedit (dikecualikan dari anggota grup). */
  roomId?: number;
  roomCode: string;
  group: string;
  position: string;
  onChange: (patch: { adjacentGroup?: string; adjacentPosition?: string }) => void;
}

/**
 * Pilih grup sekat dari daftar yang sudah ada (atau buat baru), lalu pilih
 * letak ruang di antara anggota grup. Posisi bentrok tidak bisa dipilih.
 */
export function SekatFields({ roomId, roomCode, group, position, onChange }: Props) {
  const roomsQuery = useQuery({ queryKey: ['rooms', 'all-for-sekat'], queryFn: () => roomService.getRooms() });
  const [creating, setCreating] = useState(false);

  const groups = useMemo(() => {
    const map = new Map<string, Room[]>();
    for (const room of roomsQuery.data ?? []) {
      if (room.id === roomId || !room.adjacent_group) continue;
      map.set(room.adjacent_group, [...(map.get(room.adjacent_group) ?? []), room]);
    }
    for (const members of map.values()) members.sort((a, b) => (a.adjacent_position ?? 99) - (b.adjacent_position ?? 99));
    return map;
  }, [roomId, roomsQuery.data]);

  const isExisting = group !== '' && groups.has(group);
  const members = isExisting ? groups.get(group)! : [];
  const taken = new Map(members.filter((m) => m.adjacent_position != null).map((m) => [m.adjacent_position!, m.code]));
  const maxPos = Math.max(0, ...taken.keys());

  // Posisi kosong: celah di antara anggota + satu di ujung belakang.
  const freePositions = Array.from({ length: maxPos + 1 }, (_, i) => i + 1).filter((p) => !taken.has(p));
  const describe = (p: number) => {
    const before = taken.get(p - 1);
    const after = taken.get(p + 1);
    if (before && after) return `Di antara ${before} dan ${after}`;
    if (before) return `Setelah ${before}`;
    if (after) return `Sebelum ${after}`;
    return `Posisi ${p}`;
  };

  const selectValue = creating ? NEW : group === '' ? NONE : isExisting ? group : NEW;
  const showNewInput = selectValue === NEW;

  const pickGroup = (value: string) => {
    if (value === NONE) {
      setCreating(false);
      onChange({ adjacentGroup: '', adjacentPosition: '' });
    } else if (value === NEW) {
      setCreating(true);
      onChange({ adjacentGroup: '', adjacentPosition: '1' });
    } else {
      setCreating(false);
      // Default: taruh di ujung belakang grup (selalu kosong).
      const last = Math.max(0, ...(groups.get(value) ?? []).map((m) => m.adjacent_position ?? 0)) + 1;
      onChange({ adjacentGroup: value, adjacentPosition: String(last) });
    }
  };

  // Urutan pratinjau: anggota + ruang ini di posisinya.
  const preview = [
    ...members.map((m) => ({ code: m.code, pos: m.adjacent_position ?? 99, self: false })),
    ...(group ? [{ code: roomCode || 'Ruang ini', pos: Number(position) || 99, self: true }] : []),
  ].sort((a, b) => a.pos - b.pos);

  return (
    <>
      <Field label='Grup sekat' htmlFor='sekat-group' hint={groups.size === 0 && !group ? 'Belum ada grup. Pilih "Buat grup baru" untuk ruang pertama.' : undefined}>
        <Select value={selectValue} onValueChange={pickGroup}>
          <SelectTrigger id='sekat-group' className='w-full'>
            <SelectValue placeholder='Tidak bersekat' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Tidak bersekat</SelectItem>
            {[...groups.entries()].map(([name, list]) => (
              <SelectItem key={name} value={name}>
                {name} · {list.map((m) => m.code).join(', ')}
              </SelectItem>
            ))}
            <SelectItem value={NEW}>+ Buat grup baru</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {showNewInput ? (
        <Field label='Nama grup baru' htmlFor='sekat-new' hint='Lalu pilih grup ini di ruang sebelahnya.'>
          <Input
            id='sekat-new'
            value={group}
            onChange={(e) => onChange({ adjacentGroup: e.target.value.toUpperCase(), adjacentPosition: '1' })}
            placeholder={roomCode ? `Contoh: SEKAT-${roomCode}` : 'Contoh: SEKAT-A1'}
          />
        </Field>
      ) : isExisting ? (
        <Field label='Letak ruang ini' htmlFor='sekat-position'>
          <Select value={position} onValueChange={(value) => onChange({ adjacentPosition: value })}>
            <SelectTrigger id='sekat-position' className='w-full'>
              <SelectValue placeholder='Pilih letak' />
            </SelectTrigger>
            <SelectContent>
              {freePositions.map((p) => (
                <SelectItem key={p} value={String(p)}>{describe(p)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : (
        <div className='hidden sm:block' />
      )}

      {group && preview.length > 0 && (
        <div className='flex flex-wrap items-center gap-1.5 sm:col-span-2'>
          <span className='text-xs text-muted-foreground'>Urutan:</span>
          {preview.map((item, index) => (
            <span key={`${item.code}-${index}`} className='flex items-center gap-1.5'>
              {index > 0 && <span className='text-xs text-muted-foreground'>⟷</span>}
              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', item.self ? 'bg-primary text-white' : 'bg-muted')}>{item.code}</span>
            </span>
          ))}
        </div>
      )}
    </>
  );
}
