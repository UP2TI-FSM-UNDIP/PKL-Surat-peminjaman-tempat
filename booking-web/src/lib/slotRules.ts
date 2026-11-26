import type { BookingRuleDate, ReservationMode, ReservationSlot } from '@/types/reservation';
import { addDays, format, parseISO } from 'date-fns';

export interface RoomAdjacency {
  id: number;
  adjacent_group: string | null;
  adjacent_position: number | null;
}

export interface ValidateSlotsInput {
  mode: ReservationMode;
  slots: ReservationSlot[];
  rulesByDate: Record<string, BookingRuleDate | undefined>;
  limits?: BookingRuleDate['limits'];
  expectedParticipants?: number | null;
  todayIso?: string;
  /** true untuk Ajukan Pinjam (alur langsung); hanya alur ini yang boleh H-0. */
  direct?: boolean;
}

export const SAME_DAY_RESERVATION_MESSAGE = 'Tanggal hari ini hanya bisa lewat Ajukan Pinjam.';

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
};

const isOverlapping = (a: ReservationSlot, b: ReservationSlot): boolean =>
  a.room_id === b.room_id &&
  a.booking_date === b.booking_date &&
  toMinutes(a.start_time) < toMinutes(b.end_time) &&
  toMinutes(a.end_time) > toMinutes(b.start_time);

export function validateSlotDay(
  slot: ReservationSlot,
  dayRule: BookingRuleDate | undefined,
  expectedParticipants?: number | null,
  todayIso?: string,
  direct = false,
): string[] {
  if (!dayRule) return ['Aturan tanggal belum dimuat.'];
  if (!dayRule.is_bookable) return [dayRule.message ?? 'Tanggal tidak dapat dibooking.'];

  const today = todayIso ?? format(new Date(), 'yyyy-MM-dd');
  if (slot.booking_date < today) return ['Tanggal reservasi sudah lewat.'];
  const sameDay = !!dayRule.same_day && slot.booking_date === today;
  if (sameDay && !direct) return [SAME_DAY_RESERVATION_MESSAGE];
  const earliest = format(addDays(parseISO(today), dayRule.min_booking_days), 'yyyy-MM-dd');
  if (!sameDay && slot.booking_date < earliest) return ['Tanggal reservasi terlalu dekat.'];

  const errors: string[] = [];
  if (sameDay && dayRule.min_start_time && toMinutes(slot.start_time) < toMinutes(dayRule.min_start_time)) {
    errors.push(`Pinjam hari ini: jam mulai paling cepat ${dayRule.min_start_time}.`);
  }
  const room = dayRule.rooms.find((item) => item.id === slot.room_id);
  if (!room) {
    errors.push('Ruang tidak dibuka pada tanggal ini.');
    return errors;
  }
  if (!dayRule.open_time) {
    errors.push('Jam buka belum tersedia.');
  } else if (toMinutes(slot.start_time) < toMinutes(dayRule.open_time)) {
    errors.push(`Mulai paling awal ${dayRule.open_time}.`);
  }
  if (toMinutes(slot.end_time) > toMinutes(room.max_end_time)) {
    errors.push(`Selesai paling lambat ${room.max_end_time}.`);
  }
  if (toMinutes(slot.end_time) <= toMinutes(slot.start_time)) {
    errors.push('Jam selesai harus setelah jam mulai.');
  }
  if (expectedParticipants && room.capacity != null && expectedParticipants > room.capacity) {
    errors.push(`Kapasitas ${room.code} hanya ${room.capacity}.`);
  }
  return errors;
}

export function totalRoomMinutes(slots: ReservationSlot[]): number {
  return slots.reduce(
    (total, slot) => total + Math.max(0, toMinutes(slot.end_time) - toMinutes(slot.start_time)),
    0,
  );
}

export function validateSlots(input: ValidateSlotsInput): {
  formErrors: string[];
  rowErrors: Record<number, string[]>;
} {
  const { mode, slots, rulesByDate, limits, expectedParticipants, todayIso, direct } = input;
  const formErrors: string[] = [];
  const rowErrors: Record<number, string[]> = {};

  if (slots.length === 0) formErrors.push('Minimal satu slot.');

  if (mode === 'one_room_many_dates') {
    if (new Set(slots.map((slot) => slot.room_id)).size > 1) {
      formErrors.push('Mode satu ruang hanya boleh memakai satu ruang.');
    }
    if (new Set(slots.map((slot) => slot.booking_date)).size !== slots.length) {
      formErrors.push('Tanggal tidak boleh duplikat.');
    }
    if (limits && slots.length > limits.max_dates_per_room) {
      formErrors.push(`Maksimal ${limits.max_dates_per_room} tanggal.`);
    }
  } else {
    if (new Set(slots.map((slot) => slot.booking_date)).size > 1) {
      formErrors.push('Mode satu tanggal hanya boleh memakai satu tanggal.');
    }
    if (new Set(slots.map((slot) => slot.room_id)).size !== slots.length) {
      formErrors.push('Ruang tidak boleh duplikat.');
    }
    if (limits && slots.length > limits.max_rooms_per_date) {
      formErrors.push(`Maksimal ${limits.max_rooms_per_date} ruang.`);
    }
  }

  slots.forEach((slot, index) => {
    const errors = validateSlotDay(slot, rulesByDate[slot.booking_date], expectedParticipants, todayIso, direct);
    if (errors.length > 0) rowErrors[index] = errors;
  });

  for (let i = 0; i < slots.length; i += 1) {
    for (let j = i + 1; j < slots.length; j += 1) {
      if (isOverlapping(slots[i], slots[j])) {
        rowErrors[i] = [...(rowErrors[i] ?? []), 'Slot bentrok dengan baris lain.'];
        rowErrors[j] = [...(rowErrors[j] ?? []), 'Slot bentrok dengan baris lain.'];
      }
    }
  }

  if (limits?.max_total_room_hours != null && totalRoomMinutes(slots) > limits.max_total_room_hours * 60) {
    formErrors.push(`Total durasi melebihi ${limits.max_total_room_hours} jam.`);
  }

  return { formErrors, rowErrors };
}

export function canBukaSekat(
  mode: ReservationMode,
  slots: ReservationSlot[],
  roomsById: Record<number, RoomAdjacency | undefined>,
): boolean {
  if (mode !== 'one_date_many_rooms' || slots.length < 2) return false;
  const rooms = slots.map((slot) => roomsById[slot.room_id]);
  if (rooms.some((room) => !room)) return false;

  const group = rooms[0]!.adjacent_group;
  if (!group || rooms.some((room) => room!.adjacent_group !== group)) return false;

  const positions = rooms.map((room) => room!.adjacent_position);
  if (positions.some((position) => position == null)) return false;
  const sorted = [...(positions as number[])].sort((a, b) => a - b);
  return new Set(sorted).size === sorted.length && sorted.every((position, index) => index === 0 || position === sorted[index - 1] + 1);
}
