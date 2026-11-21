import { validateSlotDay } from '@/lib/slotRules';
import type { BookingRuleDate, ReservationSlot } from '@/types/reservation';

export function DayRuleAlert({ slot, dayRule, expectedParticipants }: {
  slot: ReservationSlot;
  dayRule?: BookingRuleDate;
  expectedParticipants?: number | null;
}) {
  const errors = validateSlotDay(slot, dayRule, expectedParticipants);
  if (errors.length === 0) return null;
  return (
    <ul className="space-y-1 text-xs text-destructive">
      {errors.map((error) => <li key={error}>{error}</li>)}
    </ul>
  );
}
