import type { ReservationContent } from '@/types/reservation';

const ALLOWED_TEXT_FIELDS = [
  'event_name',
  'event_nature',
  'event_form',
  'objectives',
  'benefits',
  'target_audience',
] as const;

export function buildProposalFormData(input: {
  content: ReservationContent;
  proposal?: File | null;
}): FormData {
  const form = new FormData();
  form.append('_method', 'PUT');

  ALLOWED_TEXT_FIELDS.forEach((key) => {
    const value = input.content[key];
    // Kirim string kosong secara eksplisit agar backend dapat menghapus nilai lama.
    form.append(`content[${key}]`, value == null ? '' : String(value));
  });

  const equipment = (input.content.equipment_items ?? []).filter(
    (item) => item.nama.trim() && Number.isInteger(item.jumlah) && item.jumlah >= 1,
  );

  equipment.forEach((item, index) => {
    form.append(`content[equipment_items][${index}][nama]`, item.nama);
    form.append(`content[equipment_items][${index}][jumlah]`, String(item.jumlah));
  });

  // FormData tidak bisa mengirim array kosong; flag ini membuat backend menghapus alat.
  if (equipment.length === 0) {
    form.append('clear_equipment', '1');
  }

  if (input.proposal) {
    form.append('proposal', input.proposal);
  }

  return form;
}
