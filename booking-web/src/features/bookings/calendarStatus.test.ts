import { describe, expect, it } from 'vitest';
import {
  CALENDAR_STATUS_META,
  DEFAULT_VISIBLE_STATUSES,
  filterCalendarEvents,
} from './calendarStatus';
import type { CalendarDisplayStatus, CalendarEvent } from '@/types/calendar';

function event(id: string, status: CalendarDisplayStatus): CalendarEvent {
  return {
    id,
    document_id: Number(id),
    title: `Event ${id}`,
    room: { id: 1, code: 'F107', name: 'Ruang Sidang' },
    booking_date: '2026-12-01',
    start_time: '09:00',
    end_time: '12:00',
    display_status: status,
    status_label: CALENDAR_STATUS_META[status].label,
    status_reason: null,
  };
}

describe('status kalender Fase 3', () => {
  it('default menyembunyikan tiga status terminal', () => {
    expect(DEFAULT_VISIBLE_STATUSES).toEqual(['active', 'reservation', 'completed']);
  });

  it('filter mempertahankan urutan dan membuang status tersembunyi', () => {
    const events = [
      event('1', 'active'),
      event('2', 'cancelled'),
      event('3', 'reservation'),
      event('4', 'completed'),
    ];

    expect(
      filterCalendarEvents(events, DEFAULT_VISIBLE_STATUSES).map((item) => item.id),
    ).toEqual(['1', '3', '4']);
  });

  it('setiap status punya warna dan label sesuai SPEC', () => {
    expect(CALENDAR_STATUS_META).toMatchObject({
      active: { color: '#10b981', label: 'Aktif' },
      reservation: { color: '#ec4899', label: 'Reservasi' },
      cancelled: { color: '#6b7280', label: 'Dibatalkan' },
      expired: { color: '#f59e0b', label: 'Kedaluwarsa' },
      rejected: { color: '#ef4444', label: 'Ditolak' },
      completed: { color: '#3b82f6', label: 'Selesai' },
    });
  });
});
