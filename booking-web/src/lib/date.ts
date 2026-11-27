import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export function formatDateId(value: string | Date, pattern = 'd MMMM yyyy'): string {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, pattern, { locale: localeId });
}

export function formatDateTimeId(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/** "09:00:00" → "09:00". Nilai kosong menjadi "—". */
export function formatTime(value?: string | null): string {
  return value ? value.slice(0, 5) : '—';
}

/** Rentang jam ringkas, mis. "09:00–12:00". */
export function formatTimeRange(start?: string | null, end?: string | null): string {
  return `${formatTime(start)}–${formatTime(end)}`;
}

/** Tanggal ISO (YYYY-MM-DD) → "27 Nov 2026"; kosong/invalid → "—". */
export function formatDateShort(value?: string | null): string {
  if (!value) return '—';
  const date = parseISO(value.slice(0, 10));
  return Number.isNaN(date.getTime()) ? value : format(date, 'd MMM yyyy', { locale: localeId });
}

/** Tanggal hari ini (zona lokal) dalam format yyyy-MM-dd. */
export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}
