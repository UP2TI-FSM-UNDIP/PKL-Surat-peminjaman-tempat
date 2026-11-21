import { differenceInCalendarDays, parseISO } from 'date-fns';
import type { PolicyPreviewRow } from '@/types/booking-policy';

export function validatePolicyDraft(input: {
  min_booking_days: number;
  tiers: Array<{ min_days_before: number; deadline_offset: number; label?: string | null }>;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (input.tiers.length === 0) {
    errors.tiers = 'Minimal satu tier.';
    return errors;
  }

  const thresholds = input.tiers.map((tier) => tier.min_days_before);
  const messages: string[] = [];
  if (new Set(thresholds).size !== thresholds.length) {
    messages.push('Threshold tidak boleh duplikat.');
  }

  const last = [...input.tiers].sort((a, b) => a.min_days_before - b.min_days_before)[0];
  if (last.min_days_before !== input.min_booking_days) {
    messages.push('Baris terakhir harus sama dengan minimal hari.');
  }
  if (messages.length > 0) errors.tiers = messages.join(' ');

  input.tiers.forEach((tier, index) => {
    if (tier.deadline_offset < 1 || tier.deadline_offset > tier.min_days_before) {
      errors[`tiers.${index}.deadline_offset`] = `Offset harus 1..${tier.min_days_before}.`;
    }
  });

  return errors;
}

export function previewRowForDate(
  rows: PolicyPreviewRow[],
  hDate: string,
  today: string,
): { row: PolicyPreviewRow | null; reason?: string } {
  const days = differenceInCalendarDays(parseISO(hDate), parseISO(today));
  if (days < 1) return { row: null, reason: 'Tanggal H harus setelah hari ini.' };
  if (days > 30) return { row: null, reason: 'Di luar jendela preview 30 hari.' };
  const row = rows.find((item) => item.h_minus === days) ?? null;
  return row ? { row } : { row: null, reason: 'Tier tidak ditemukan.' };
}

export function normalizeWarnings(warnings: unknown): Record<string, string[]> {
  if (!warnings || Array.isArray(warnings) || typeof warnings !== 'object') return {};
  return warnings as Record<string, string[]>;
}
