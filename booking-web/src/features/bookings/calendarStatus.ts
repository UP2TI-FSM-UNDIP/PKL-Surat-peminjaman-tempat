import type { CalendarDisplayStatus, CalendarEvent } from '@/types/calendar';

export const CALENDAR_STATUS_META: Record<
  CalendarDisplayStatus,
  { color: string; label: string }
> = {
  active: { color: '#10b981', label: 'Aktif' },
  reservation: { color: '#ec4899', label: 'Reservasi' },
  cancelled: { color: '#6b7280', label: 'Dibatalkan' },
  expired: { color: '#f59e0b', label: 'Kedaluwarsa' },
  rejected: { color: '#ef4444', label: 'Ditolak' },
  completed: { color: '#3b82f6', label: 'Selesai' },
};

export const CALENDAR_STATUS_ORDER: CalendarDisplayStatus[] = [
  'active',
  'reservation',
  'cancelled',
  'expired',
  'rejected',
  'completed',
];

export const TERMINAL_STATUSES: CalendarDisplayStatus[] = [
  'cancelled',
  'expired',
  'rejected',
];

export const DEFAULT_VISIBLE_STATUSES: CalendarDisplayStatus[] = [
  'active',
  'reservation',
  'completed',
];

export function filterCalendarEvents(
  events: CalendarEvent[],
  visible: CalendarDisplayStatus[],
): CalendarEvent[] {
  const allowed = new Set(visible);
  return events.filter((event) => allowed.has(event.display_status));
}
