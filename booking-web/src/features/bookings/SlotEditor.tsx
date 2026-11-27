import { useEffect } from 'react';
import { Controller, useFieldArray, useWatch, type Control, type UseFormSetValue } from 'react-hook-form';
import { DateInput } from '@/components/ui/date-input';
import { Button } from '@/components/ui/button/button';
import { RoomPicker } from './RoomPicker';
import { TimeSelect } from './TimeSelect';
import { Plus, Trash2 } from 'lucide-react';
import type { Room } from '@/services/room.service';
import type { BookingRuleDate, ReservationMode } from '@/types/reservation';
import type { ReservationWizardValues } from './reservationForm.types';

interface Props {
  control: Control<ReservationWizardValues>;
  setValue: UseFormSetValue<ReservationWizardValues>;
  mode: ReservationMode;
  rooms: Room[];
  rulesByDate: Record<string, BookingRuleDate | undefined>;
  maxRows: number;
  rowErrors: Record<number, string[]>;
  availability?: Record<number, boolean>;
}

export function SlotEditor({ control, setValue, mode, rooms, rulesByDate, maxRows, rowErrors, availability }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'slots' });
  const roomId = useWatch({ control, name: 'room_id' });
  const bookingDate = useWatch({ control, name: 'booking_date' });
  const slots = useWatch({ control, name: 'slots' }) ?? [];

  useEffect(() => {
    for (let index = 0; index < fields.length; index += 1) {
      if (mode === 'one_room_many_dates' && roomId) {
        setValue(`slots.${index}.room_id`, roomId, { shouldDirty: true });
      }
      if (mode === 'one_date_many_rooms' && bookingDate) {
        setValue(`slots.${index}.booking_date`, bookingDate, { shouldDirty: true });
      }
    }
  }, [bookingDate, fields.length, mode, roomId, setValue]);

  const addRow = () => {
    append({
      room_id: mode === 'one_room_many_dates' ? (roomId ?? 0) : 0,
      booking_date: mode === 'one_date_many_rooms' ? bookingDate : '',
      start_time: '09:00',
      end_time: mode === 'one_date_many_rooms' ? '16:30' : '16:30',
    });
  };

  const ruleText = (rule: BookingRuleDate | undefined, maxEnd: string) =>
    !rule ? null
      : rule.same_day ? `Hari ini · mulai ≥ ${rule.min_start_time ?? ''}`
      : rule.day_type === 'saturday' ? 'Sabtu · 09.00–17.00'
      : rule.day_type === 'weekday' ? `Hari kerja · s.d. ${maxEnd.replace(':', '.')}`
      : rule.message ?? null;

  return (
    <div className="space-y-2">
      <div className="hidden gap-3 px-3 text-[13px] font-medium text-foreground md:grid md:grid-cols-[28px_minmax(0,1fr)_140px_140px_36px]">
        <span className="text-center text-muted-foreground">No</span>
        <span>{mode === 'one_room_many_dates' ? 'Tanggal' : 'Ruang'}</span>
        <span>Jam mulai</span>
        <span>Jam selesai</span>
        <span />
      </div>
      {fields.map((field, index) => {
        const rowSlot = slots[index];
        const date = mode === 'one_room_many_dates' ? rowSlot?.booking_date : bookingDate;
        const rowRoomId = mode === 'one_room_many_dates' ? roomId : rowSlot?.room_id;
        const rule = rulesByDate[date ?? ''];
        const maxEnd = rule?.rooms.find((room) => room.id === rowRoomId)?.max_end_time ?? '16:30';
        const hint = ruleText(rule, maxEnd);
        const conflict = availability?.[index] === false;
        const ok = availability?.[index] === true;
        return (
          <div key={field.id} className={`space-y-2 rounded-xl p-3 ${conflict || rowErrors[index]?.length ? 'bg-[#fdeeee]/70 ring-1 ring-destructive/20' : 'bg-muted/70'}`}>
            <div className="grid grid-cols-[1fr_1fr_36px] gap-2 md:grid-cols-[28px_minmax(0,1fr)_140px_140px_36px] md:items-center md:gap-3">
              <span className="hidden text-center text-[13px] font-medium text-muted-foreground tabular-nums md:block">{index + 1}</span>
              <div className="col-span-3 md:col-span-1">
                {mode === 'one_room_many_dates' ? (
                  <Controller
                    control={control}
                    name={`slots.${index}.booking_date`}
                    render={({ field: dateField }) => (
                      <DateInput id={`slot-${index}-booking-date`} value={dateField.value} onChange={dateField.onChange} aria-label="Tanggal" />
                    )}
                  />
                ) : (
                  <Controller
                    control={control}
                    name={`slots.${index}.room_id`}
                    render={({ field: roomField }) => (
                      <RoomPicker rooms={rooms} value={roomField.value || null} onChange={(id) => roomField.onChange(id)} />
                    )}
                  />
                )}
              </div>
              <Controller
                control={control}
                name={`slots.${index}.start_time`}
                render={({ field: timeField }) => (
                  <TimeSelect label="Jam mulai" value={timeField.value} onChange={timeField.onChange} min={rule?.same_day ? rule.min_start_time ?? undefined : undefined} />
                )}
              />
              <Controller
                control={control}
                name={`slots.${index}.end_time`}
                render={({ field: timeField }) => (
                  <TimeSelect label="Jam selesai" value={timeField.value} onChange={timeField.onChange} min={rowSlot?.start_time} max={maxEnd} />
                )}
              />
              <Button type="button" variant="ghost" size="icon" aria-label="Hapus slot" onClick={() => remove(index)} disabled={fields.length === 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {(hint || ok) && (
              <div className="flex flex-wrap items-center gap-2 text-[12px] md:pl-[40px]">
                {hint && <span className="rounded-full bg-white px-2 py-0.5 text-muted-foreground ring-1 ring-black/[0.06]">{hint}</span>}
                {ok && <span className="rounded-full bg-[#ecf8ef] px-2 py-0.5 font-medium text-[#248a3d]">Tersedia</span>}
              </div>
            )}
            {rowErrors[index]?.map((error) => (
              <p key={error} className="text-[13px] text-destructive md:pl-[40px]">{error}</p>
            ))}
            {conflict && <p className="text-[13px] text-destructive md:pl-[40px]">Slot ini bentrok dengan booking lain.</p>}
          </div>
        );
      })}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <Button type="button" variant="outline" onClick={addRow} disabled={fields.length >= maxRows} className="gap-1.5">
          <Plus className="size-4" />
          {mode === 'one_room_many_dates' ? 'Tambah tanggal' : 'Tambah ruang'}
        </Button>
        <span className="text-xs text-muted-foreground">{fields.length} dari maks. {maxRows} {mode === 'one_room_many_dates' ? 'tanggal' : 'ruang'}</span>
      </div>
    </div>
  );
}
