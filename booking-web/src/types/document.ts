// src/types/document.ts
import { DOCUMENT_STATUS, DOCUMENT_ACTIONS } from '@/constants/document';
import type { PaginatedData } from './pagination';
import type { ReservationContent, RoomBookingSummary } from './reservation';

export type DocumentStatus =
  (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];
export type DocumentAction =
  (typeof DOCUMENT_ACTIONS)[keyof typeof DOCUMENT_ACTIONS];

// User helper (bisa dipindah ke user.ts jika mau lebih rapi)
export interface UserShort {
  id: number;
  name: string;
  email: string;
  nim_nip?: string | null;
  role?: {
    id: number;
    name: string;
    slug: string;
  };
  unit?: {
    id: number;
    name: string;
    code: string;
  };
}

export type BookingContent = ReservationContent;

// Log Interface
export interface DocumentLog {
  id: number;
  document_id: number;
  user_id: number;
  action: DocumentAction;
  note?: string;
  step_snapshot?: number;
  created_at: string;
  user?: UserShort;
}

// Document Interface (Generic TContent)
export interface Document<TContent = ReservationContent> {
  id: number;
  /** ID publik acak (ULID huruf kecil) untuk URL & API; jangan tampilkan ID numerik ke pengguna. */
  public_id?: string;
  workflow_id: number;
  title: string;
  content?: TContent;
  attachment_path?: string;
  meta_data?: Record<string, string | number | boolean | null>;
  unit_id: number;
  creator_id: number;
  current_holder_id?: number;
  status: DocumentStatus;
  current_step_order: number;

  // File Paths
  file_proposal?: string;

  reservation_deadline?: string | null;
  proposal_completed_at?: string | null;
  expired_at?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: number | null;
  deadline_policy_id?: number | null;
  deadline_rule_snapshot?: Record<string, unknown> | null;
  room_bookings?: RoomBookingSummary[];

  completed_at?: string;
  created_at: string;
  updated_at: string;

  // Relations
  workflow?: {
    id: number;
    name: string;
    description?: string;
    steps?: Array<{
      id: number;
      workflow_id: number;
      step_order: number;
      step_name: string;
      target_role_slug: string;
      scope_type: string;
    }>;
  };
  current_holder?: UserShort;
  creator?: UserShort;
  unit?: {
    id: number;
    name: string;
    code: string;
  };
  logs?: DocumentLog[];
}

// API Response Types
export interface DocumentsResponse {
  success: boolean;
  data: {
    my_documents: PaginatedData<Document>;
    pending_documents: PaginatedData<Document>;
    processed_documents: PaginatedData<Document>;
    all_documents?: PaginatedData<Document>;
  };
}

export interface SingleDocumentResponse {
  success: boolean;
  data: Document;
}

/** Kunci dokumen untuk URL/API: ID publik acak bila ada. */
export type DocumentKey = number | string;

export function documentKey(doc: { id: number; public_id?: string | null }): string {
  return doc.public_id || String(doc.id);
}
