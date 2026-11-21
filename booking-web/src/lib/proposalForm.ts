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
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      form.append(`content[${key}]`, String(value));
    }
  });

  input.content.equipment_items?.forEach((item, index) => {
    if (!item.nama.trim() || !Number.isInteger(item.jumlah) || item.jumlah < 1) return;
    form.append(`content[equipment_items][${index}][nama]`, item.nama);
    form.append(`content[equipment_items][${index}][jumlah]`, String(item.jumlah));
  });

  if (input.proposal) {
    form.append('proposal', input.proposal);
  }

  return form;
}
