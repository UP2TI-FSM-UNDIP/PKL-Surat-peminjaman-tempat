import type { DocumentKey } from '@/types/document';
import api from '@/lib/axios';
import type { Document } from '@/types/document';
import type { ReservationContent } from '@/types/reservation';

interface SingleResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const approvalService = {
  async approve(documentId: DocumentKey, note?: string): Promise<Document<ReservationContent>> {
    const response = await api.post<SingleResponse<Document<ReservationContent>>>(
      `/documents/${documentId}/approve`,
      { note: note?.trim() || null },
    );
    return response.data.data;
  },

  async reject(documentId: DocumentKey, note: string): Promise<Document<ReservationContent>> {
    const response = await api.post<SingleResponse<Document<ReservationContent>>>(
      `/documents/${documentId}/reject`,
      { note },
    );
    return response.data.data;
  },

  async revise(documentId: DocumentKey, note: string): Promise<Document<ReservationContent>> {
    const response = await api.post<SingleResponse<Document<ReservationContent>>>(
      `/documents/${documentId}/revise`,
      { note },
    );
    return response.data.data;
  },
};
