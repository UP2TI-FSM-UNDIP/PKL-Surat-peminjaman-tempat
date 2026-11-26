import type { Document } from './document';

export type ReservationMode = 'one_room_many_dates' | 'one_date_many_rooms';

export interface EquipmentItem {
  nama: string;
  jumlah: number;
}

export interface ReservationSlot {
  room_id: number;
  room_code?: string;
  room_name?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
}

export interface ReservationContent {
  mode?: ReservationMode;
  slots?: ReservationSlot[];
  purpose?: string;
  ketua_pelaksana_nama?: string;
  ketua_pelaksana_identitas?: string;
  ketua_pelaksana_hp?: string;
  expected_participants?: number | null;
  buka_sekat?: boolean;
  event_name?: string;
  event_nature?: string;
  event_form?: string;
  objectives?: string;
  benefits?: string;
  target_audience?: string;
  equipment_items?: EquipmentItem[];
}

export interface ReservationPayload {
  mode: ReservationMode;
  slots: ReservationSlot[];
  purpose: string;
  ketua_pelaksana_nama: string;
  ketua_pelaksana_identitas: string;
  ketua_pelaksana_hp: string;
  expected_participants?: number | null;
  buka_sekat: boolean;
  intent: 'reservation' | 'submit';
}

export interface RoomBookingSummary {
  id: number;
  room_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
}

export interface BookingRuleRoom {
  id: number;
  code: string;
  name: string;
  type: string | null;
  capacity: number | null;
  max_end_time: string;
}

export interface BookingRuleLimits {
  max_dates_per_room: number;
  max_rooms_per_date: number;
  max_total_room_hours: number | null;
}

export interface BookingRuleDate {
  date: string;
  day_type: 'weekday' | 'saturday' | 'sunday' | 'too_soon' | 'past';
  is_bookable: boolean;
  open_time: string | null;
  min_booking_days: number;
  rooms: BookingRuleRoom[];
  limits: BookingRuleLimits;
  message?: string | null;
}

export interface AvailabilityConflict {
  booking_id: number;
  document_id: number;
  room_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
}

export interface AvailabilityBatchSlot {
  slot_index: number;
  available: boolean;
  reasons: string[];
  conflicts: AvailabilityConflict[];
}

export interface AvailabilityBatch {
  available: boolean;
  slots: AvailabilityBatchSlot[];
}

export interface ReservationSummary {
  document: Document<ReservationContent>;
  slots: Array<ReservationSlot & { is_sekat: boolean }>;
  equipment_items: EquipmentItem[];
  completeness: { is_complete: boolean; missing_fields: string[] };
  proposal_completed_at: string | null;
  reservation_deadline: string | null;
  status: 'DRAFT' | 'IN_PROGRESS' | 'REVISION' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  timeline: Array<{ action: string; note: string | null; at: string }>;
}
