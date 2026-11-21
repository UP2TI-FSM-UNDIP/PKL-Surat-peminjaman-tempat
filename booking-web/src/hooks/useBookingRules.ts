import { useQueries } from '@tanstack/react-query';
import { bookingRuleService } from '@/services/booking-rule.service';
import type { BookingRuleDate } from '@/types/reservation';

export function useBookingRules(dates: string[]) {
  const uniqueDates = [...new Set(dates.filter(Boolean))];
  const queries = useQueries({
    queries: uniqueDates.map((date) => ({
      queryKey: ['booking-rules', date],
      queryFn: () => bookingRuleService.getByDate(date),
      enabled: !!date,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const rulesByDate: Record<string, BookingRuleDate | undefined> = {};
  uniqueDates.forEach((date, index) => {
    rulesByDate[date] = queries[index]?.data;
  });

  return {
    rulesByDate,
    isLoading: queries.some((query) => query.isLoading),
    errors: queries.map((query) => query.error).filter(Boolean),
  };
}
