import type { EquipmentItem } from '@/types/reservation';

export interface ProposalFormValues {
  event_name: string;
  event_nature: string;
  event_form: string;
  objectives: string;
  benefits: string;
  target_audience: string;
  equipment_items: EquipmentItem[];
}
