import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROOM_TYPES, type RoomType } from '@/services/room.service';

export interface RoomWeekdayFieldsValue {
  type: RoomType | '';
  isBookableWeekday: boolean;
  weekdayMaxEndTime: string;
  adjacentGroup: string;
  adjacentPosition: string;
}

interface RoomWeekdayFieldsProps {
  value: RoomWeekdayFieldsValue;
  onChange: (patch: Partial<RoomWeekdayFieldsValue>) => void;
}

export function RoomWeekdayFields({ value, onChange }: RoomWeekdayFieldsProps) {
  return (
    <>
      <div className='grid gap-2'>
        <label htmlFor='room-type' className='text-sm font-medium'>
          Tipe Ruang
        </label>
        <Select
          value={value.type || 'UNSET'}
          onValueChange={(next) =>
            onChange({ type: next === 'UNSET' ? '' : (next as RoomType) })
          }
        >
          <SelectTrigger id='room-type'>
            <SelectValue placeholder='Pilih tipe ruang' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='UNSET'>Belum ditentukan</SelectItem>
            {ROOM_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='flex items-start gap-3'>
        <Checkbox
          id='is-bookable-weekday'
          checked={value.isBookableWeekday}
          onCheckedChange={(checked) =>
            onChange({ isBookableWeekday: checked === true })
          }
        />
        <div>
          <label htmlFor='is-bookable-weekday' className='text-sm font-medium'>
            Boleh dibooking Senin–Jumat
          </label>
          <p className='text-xs text-gray-500'>
            Jika dicentang, ruang muncul di form peminjaman hari kerja. Sabtu
            tetap menampilkan semua ruang aktif.
          </p>
        </div>
      </div>

      <div className='grid gap-2'>
        <label htmlFor='weekday-max-end' className='text-sm font-medium'>
          Batas akhir hari kerja
        </label>
        <Input
          id='weekday-max-end'
          type='time'
          value={value.weekdayMaxEndTime}
          onChange={(event) =>
            onChange({ weekdayMaxEndTime: event.target.value })
          }
        />
        <p className='text-xs text-gray-500'>
          Kosong berarti memakai batas default 16:30.
          {value.type === 'STUDIO' ? ' Studio umumnya memakai batas 18:00.' : ''}
        </p>
      </div>

      <div className='grid gap-2'>
        <label htmlFor='adjacent-group' className='text-sm font-medium'>
          Grup sekat
        </label>
        <Input
          id='adjacent-group'
          value={value.adjacentGroup}
          onChange={(event) => onChange({ adjacentGroup: event.target.value })}
          placeholder='A1-2'
        />
      </div>

      <div className='grid gap-2'>
        <label htmlFor='adjacent-position' className='text-sm font-medium'>
          Posisi sekat
        </label>
        <Input
          id='adjacent-position'
          type='number'
          min={1}
          value={value.adjacentPosition}
          onChange={(event) =>
            onChange({ adjacentPosition: event.target.value })
          }
          placeholder='1'
        />
      </div>
    </>
  );
}
