import { describe, expect, it } from 'vitest';
import { normalizeWarnings, previewRowForDate, validatePolicyDraft } from './policyRules';
import type { PolicyPreviewRow } from '@/types/booking-policy';

describe('validatePolicyDraft', () => {
  it('menolak threshold duplikat', () => {
    const errors = validatePolicyDraft({
      min_booking_days: 1,
      tiers: [
        { min_days_before: 10, deadline_offset: 9, label: null },
        { min_days_before: 10, deadline_offset: 5, label: null },
      ],
    });
    expect(errors.tiers).toContain('duplikat');
  });

  it('menolak baris terakhir tidak sama dengan min_booking_days', () => {
    const errors = validatePolicyDraft({
      min_booking_days: 1,
      tiers: [{ min_days_before: 5, deadline_offset: 4, label: null }],
    });
    expect(errors.tiers).toContain('terakhir');
  });

  it('menolak offset di luar rentang', () => {
    const errors = validatePolicyDraft({
      min_booking_days: 1,
      tiers: [
        { min_days_before: 5, deadline_offset: 6, label: null },
        { min_days_before: 1, deadline_offset: 1, label: null },
      ],
    });
    expect(errors['tiers.0.deadline_offset']).toContain('1..5');
  });
});

describe('previewRowForDate', () => {
  const rows: PolicyPreviewRow[] = [
    { h_minus: 10, application_date: '2026-12-01', matched_min_days: 10, deadline_offset: 9, deadline: '2026-12-02' },
    { h_minus: 5, application_date: '2026-12-06', matched_min_days: 5, deadline_offset: 4, deadline: '2026-12-07' },
  ];

  it('memilih baris berdasarkan selisih H', () => {
    expect(previewRowForDate(rows, '2026-12-11', '2026-12-01').row?.h_minus).toBe(10);
  });

  it('menolak H-0', () => {
    expect(previewRowForDate(rows, '2026-12-01', '2026-12-01').reason).toContain('setelah hari ini');
  });

  it('menolak di luar 30 hari', () => {
    expect(previewRowForDate(rows, '2027-02-01', '2026-12-01').reason).toContain('30 hari');
  });
});

describe('normalizeWarnings', () => {
  it('mengubah array kosong menjadi object', () => {
    expect(normalizeWarnings([])).toEqual({});
  });

  it('mempertahankan record validasi', () => {
    expect(normalizeWarnings({ tiers: ['Salah'] })).toEqual({ tiers: ['Salah'] });
  });
});
