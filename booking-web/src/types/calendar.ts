import type { DocumentStatus } from './document';
import type { EquipmentItem, ReservationSlot } from './reservation';

export type CalendarDisplayStatus =
  | 'active'
  | 'reservation'
  | 'cancelled'
  | 'expired'
  | 'rejected'
  | 'completed';

export interface CalendarEvent {
  id: string;
  document_id: number;
  title: string;
  room: { id: number; code: string; name: string };
  booking_date: string;
  start_time: string;
  end_time: string;
  display_status: CalendarDisplayStatus;
  status_label: string;
  status_reason: string | null;
}

export interface CalendarDocument {
  id: number;
  public_id?: string;
  purpose: string;
  status: DocumentStatus;
  creator: {
    id: number;
    name: string;
    unit_code: string | null;
    unit_name: string | null;
  };
  proposal_completed_at: string | null;
  reservation_deadline: string | null;
  expected_participants: number | null;
  buka_sekat: boolean;
  equipment_items: EquipmentItem[];
  slots: ReservationSlot[];
}

export interface CalendarResponse {
  from: string;
  to: string;
  events: CalendarEvent[];
  documents: Record<string, CalendarDocument>;
}
