import { describe, expect, it } from 'vitest';
import { buildProposalFormData } from './proposalForm';

describe('buildProposalFormData', () => {
  it('mengirim _method PUT dan field content yang diizinkan', () => {
    const form = buildProposalFormData({
      content: { event_name: 'Seminar', objectives: 'Belajar', equipment_items: [{ nama: 'Proyektor', jumlah: 2 }] },
      proposal: null,
    });
    expect(form.get('_method')).toBe('PUT');
    expect(form.get('content[event_name]')).toBe('Seminar');
    expect(form.get('content[equipment_items][0][nama]')).toBe('Proyektor');
    expect(form.get('content[equipment_items][0][jumlah]')).toBe('2');
  });

  it('tidak mengirim field reservasi read-only', () => {
    const form = buildProposalFormData({
      content: { event_name: 'Seminar', slots: [{ room_id: 1, booking_date: '2026-12-01', start_time: '09:00', end_time: '12:00' }] },
      proposal: null,
    });
    expect(form.get('content[slots]')).toBeNull();
  });

  it('mengirim nilai kosong dan flag hapus alat', () => {
    const form = buildProposalFormData({
      content: { event_name: 'Seminar', benefits: '', equipment_items: [] },
      proposal: null,
    });
    expect(form.get('content[benefits]')).toBe('');
    expect(form.get('clear_equipment')).toBe('1');
  });

  it('tidak mengirim flag hapus alat bila ada alat valid', () => {
    const form = buildProposalFormData({
      content: { equipment_items: [{ nama: 'Proyektor', jumlah: 1 }] },
      proposal: null,
    });
    expect(form.get('clear_equipment')).toBeNull();
  });
});
