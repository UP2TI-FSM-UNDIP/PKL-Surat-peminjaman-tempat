import api from '@/lib/axios';

export interface RoomBooking {
  id: number;
  document_id: number;
  room_id: number;
  booked_by: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  special_requirements?: string;
  expected_participants?: number;
  created_at: string;
  updated_at: string;
  room?: {
    id: number;
    name: string;
    capacity: number;
  };
  document?: {
    id: number;
    title: string;
    status: string;
  };
  booked_by_user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface BookingFilters {
  document_id?: number;
  room_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  my_bookings?: boolean;
  my_unit_bookings?: boolean;
}

export interface BookingStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  completed: number;
}

export interface BookingResponse {
  success: boolean;
  data: {
    data: RoomBooking[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface SingleBookingResponse {
  success: boolean;
  data: RoomBooking;
}

export const bookingService = {
  /**
   * Get list of room bookings with optional filters
   */
  async getBookings(filters?: BookingFilters): Promise<RoomBooking[]> {
    const response = await api.get<BookingResponse>('/room-bookings', { params: filters });
    // Backend returns paginated response — extract the actual array
    return response.data.data?.data ?? [];
  },

  /**
   * Alias baca daftar booking dengan dukungan pagination per_page.
   */
  async list(filters?: BookingFilters & { per_page?: number }): Promise<RoomBooking[]> {
    const response = await api.get<BookingResponse>('/room-bookings', { params: filters });
    return response.data.data?.data ?? [];
  },

  /**
   * Get single booking detail
   */
  async getBooking(id: number): Promise<RoomBooking> {
    const response = await api.get<SingleBookingResponse>(
      `/room-bookings/${id}`,
    );
    return response.data.data;
  },

  /**
   * Ambil QR code booking sebagai blob beserta object URL.
   */
  async fetchQr(bookingId: number): Promise<{ blob: Blob; objectUrl: string }> {
    const response = await api.get<Blob>(`/room-bookings/${bookingId}/qrcode`, {
      responseType: 'blob',
    });
    return { blob: response.data, objectUrl: URL.createObjectURL(response.data) };
  },

  /**
   * Ambil data receipt booking.
   */
  async receipt(bookingId: number): Promise<Record<string, unknown>> {
    const response = await api.get<{ success: boolean; data: Record<string, unknown> }>(
      `/room-bookings/${bookingId}/receipt`,
    );
    return response.data.data;
  },

  /**
   * Alias complete booking.
   */
  async complete(bookingId: number): Promise<RoomBooking> {
    const response = await api.post<SingleBookingResponse>(`/room-bookings/${bookingId}/complete`);
    return response.data.data;
  },

  /**
   * Get booking statistics
   */
  async getStatistics(): Promise<BookingStatistics> {
    const response = await api.get<{ success: boolean; data: BookingStatistics }>(
      '/room-bookings/statistics',
    );
    return response.data.data;
  },
};
