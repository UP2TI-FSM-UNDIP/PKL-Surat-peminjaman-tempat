import api from '@/lib/axios';
import type { BookingRuleDate } from '@/types/reservation';

export const bookingRuleService = {
  async getByDate(date: string): Promise<BookingRuleDate> {
    const response = await api.get<{ success: boolean; data: BookingRuleDate }>('/booking-rules', {
      params: { date },
    });
    return response.data.data;
  },
};
