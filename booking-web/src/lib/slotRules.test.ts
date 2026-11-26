import { describe, expect, it } from 'vitest';
import { canBukaSekat, totalRoomMinutes, validateSlotDay, validateSlots } from './slotRules';
import type { BookingRuleDate, ReservationSlot } from '@/types/reservation';

const limits = { max_dates_per_room: 3, max_rooms_per_date: 2, max_total_room_hours: 8 };
const dayRule: BookingRuleDate = {
  date: '2026-12-01',
  day_type: 'weekday',
  is_bookable: true,
  open_time: '09:00',
  min_booking_days: 1,
  rooms: [{ id: 1, code: 'F104', name: 'F104', type: 'KELAS', capacity: 30, max_end_time: '16:30' }],
  limits,
  message: null,
};
const slot = (patch: Partial<ReservationSlot> = {}): ReservationSlot => ({
  room_id: 1,
  booking_date: '2026-12-01',
  start_time: '09:00',
  end_time: '12:00',
  ...patch,
});

describe('validateSlotDay', () => {
  it('menolak tanggal yang tidak bookable dengan pesan server', () => {
    expect(validateSlotDay(slot(), { ...dayRule, is_bookable: false, message: 'Minggu tidak tersedia.' }))
      .toEqual(['Minggu tidak tersedia.']);
  });

  it('menolak H-0 berdasarkan min_booking_days', () => {
    expect(validateSlotDay(slot({ booking_date: '2026-11-20' }), { ...dayRule, date: '2026-11-20' }, undefined, '2026-11-20'))
      .toContain('Tanggal reservasi terlalu dekat.');
  });

  it('H-0 ditolak untuk reservasi', () => {
    const today = { ...dayRule, date: '2026-11-20', same_day: true, min_start_time: '11:00' };
    expect(validateSlotDay(slot({ booking_date: '2026-11-20', start_time: '13:00', end_time: '15:00' }), today, undefined, '2026-11-20'))
      .toEqual(['Tanggal hari ini hanya bisa lewat Ajukan Pinjam.']);
  });

  it('H-0 boleh untuk Ajukan Pinjam dengan jeda jam mulai', () => {
    const today = { ...dayRule, date: '2026-11-20', same_day: true, min_start_time: '11:00' };
    expect(validateSlotDay(slot({ booking_date: '2026-11-20', start_time: '13:00', end_time: '15:00' }), today, undefined, '2026-11-20', true))
      .toEqual([]);
    expect(validateSlotDay(slot({ booking_date: '2026-11-20', start_time: '10:00', end_time: '12:00' }), today, undefined, '2026-11-20', true))
      .toContain('Pinjam hari ini: jam mulai paling cepat 11:00.');
  });

  it('menolak tanggal yang sudah lewat dengan pesan berbeda', () => {
    expect(validateSlotDay(slot({ booking_date: '2026-11-18' }), { ...dayRule, date: '2026-11-18' }, undefined, '2026-11-20'))
      .toEqual(['Tanggal reservasi sudah lewat.']);
  });

  it('menolak jam lewat max_end_time', () => {
    expect(validateSlotDay(slot({ end_time: '17:00' }), dayRule)).toContain('Selesai paling lambat 16:30.');
  });

  it('menolak ruang yang tidak ada di daftar hari itu', () => {
    expect(validateSlotDay(slot({ room_id: 99 }), dayRule)).toContain('Ruang tidak dibuka pada tanggal ini.');
  });

  it('menolak peserta melebihi kapasitas', () => {
    expect(validateSlotDay(slot(), dayRule, 40)).toContain('Kapasitas F104 hanya 30.');
  });
});

describe('validateSlots', () => {
  it('menandai overlap parsial pada kedua baris', () => {
    const result = validateSlots({
      mode: 'one_date_many_rooms',
      slots: [slot({ start_time: '09:00', end_time: '12:00' }), slot({ start_time: '10:00', end_time: '11:00' })],
      rulesByDate: { '2026-12-01': dayRule },
      todayIso: '2026-11-20',
    });
    expect(result.rowErrors[0]).toContain('Slot bentrok dengan baris lain.');
    expect(result.rowErrors[1]).toContain('Slot bentrok dengan baris lain.');
  });

  it('menolak jumlah baris melebihi limit', () => {
    const result = validateSlots({
      mode: 'one_room_many_dates',
      slots: [slot({ booking_date: '2026-12-01' }), slot({ booking_date: '2026-12-02' }), slot({ booking_date: '2026-12-03' }), slot({ booking_date: '2026-12-04' })],
      rulesByDate: {},
      limits,
      todayIso: '2026-11-20',
    });
    expect(result.formErrors).toContain('Maksimal 3 tanggal.');
  });

  it('menghitung total jam dalam menit', () => {
    expect(totalRoomMinutes([slot(), slot({ start_time: '13:00', end_time: '15:30' })])).toBe(330);
  });

  it('menolak total jam melebihi limit', () => {
    const result = validateSlots({
      mode: 'one_room_many_dates',
      slots: [slot({ end_time: '16:30' }), slot({ booking_date: '2026-12-02', end_time: '16:30' })],
      rulesByDate: { '2026-12-01': dayRule, '2026-12-02': dayRule },
      limits: { ...limits, max_total_room_hours: 10 },
      todayIso: '2026-11-20',
    });
    expect(result.formErrors).toContain('Total durasi melebihi 10 jam.');
  });
});

describe('canBukaSekat', () => {
  const rooms = {
    1: { id: 1, adjacent_group: 'A', adjacent_position: 1 },
    2: { id: 2, adjacent_group: 'A', adjacent_position: 2 },
    3: { id: 3, adjacent_group: 'A', adjacent_position: 4 },
  };

  it('true untuk posisi berurutan', () => {
    expect(canBukaSekat('one_date_many_rooms', [slot({ room_id: 1 }), slot({ room_id: 2 })], rooms)).toBe(true);
  });

  it('false untuk posisi berlubang', () => {
    expect(canBukaSekat('one_date_many_rooms', [slot({ room_id: 2 }), slot({ room_id: 3 })], rooms)).toBe(false);
  });

  it('false untuk mode lain', () => {
    expect(canBukaSekat('one_room_many_dates', [slot({ room_id: 1 }), slot({ room_id: 2 })], rooms)).toBe(false);
  });
});
