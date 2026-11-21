import type { ReservationMode, ReservationSlot } from '@/types/reservation';

export interface ReservationWizardValues {
  mode: ReservationMode;
  room_id: number | null;
  booking_date: string;
  slots: ReservationSlot[];
  purpose: string;
  ketua_pelaksana_nama: string;
  ketua_pelaksana_identitas: string;
  ketua_pelaksana_hp: string;
  expected_participants: string;
  buka_sekat: boolean;
}
