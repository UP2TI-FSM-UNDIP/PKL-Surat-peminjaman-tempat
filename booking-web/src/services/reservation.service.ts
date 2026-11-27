import type { DocumentKey } from '@/types/document';
import api from '@/lib/axios';
import type {
  AvailabilityBatch,
  ReservationContent,
  ReservationPayload,
  ReservationSummary,
  ReservationSlot,
} from '@/types/reservation';
import type { Document } from '@/types/document';

interface SingleResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const reservationService = {
  async create(payload: ReservationPayload): Promise<Document<ReservationContent>> {
    const response = await api.post<SingleResponse<Document<ReservationContent>>>('/reservations', payload);
    return response.data.data;
  },

  async updateProposal(documentId: DocumentKey, form: FormData): Promise<Document<ReservationContent>> {
    const response = await api.post<SingleResponse<Document<ReservationContent>>>(
      `/reservations/${documentId}/proposal`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data.data;
  },

  async cancel(documentId: DocumentKey, reason?: string): Promise<Document<ReservationContent>> {
    const response = await api.post<SingleResponse<Document<ReservationContent>>>(
      `/reservations/${documentId}/cancel`,
      { reason: reason?.trim() || null },
    );
    return response.data.data;
  },

  async summary(documentId: DocumentKey): Promise<ReservationSummary> {
    const response = await api.get<SingleResponse<ReservationSummary>>(`/reservations/${documentId}/summary`);
    return response.data.data;
  },

  async checkAvailabilityBatch(
    slots: ReservationSlot[],
    excludeDocumentId?: number,
  ): Promise<AvailabilityBatch> {
    const response = await api.post<SingleResponse<AvailabilityBatch>>('/rooms/check-availability-batch', {
      slots,
      exclude_document_id: excludeDocumentId ?? null,
    });
    return response.data.data;
  },
};
