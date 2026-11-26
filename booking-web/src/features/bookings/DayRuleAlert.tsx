import { Callout } from '@/components/ui/callout';
import { validateSlotDay } from '@/lib/slotRules';
import type { BookingRuleDate, ReservationSlot } from '@/types/reservation';

export function DayRuleAlert({ slot, dayRule, expectedParticipants, direct = false }: {
  slot: ReservationSlot;
  dayRule?: BookingRuleDate;
  expectedParticipants?: number | null;
  direct?: boolean;
}) {
  const errors = validateSlotDay(slot, dayRule, expectedParticipants, undefined, direct);
  if (errors.length === 0) return null;
  return (
    <Callout tone="warning">
      {errors.length === 1 ? errors[0] : (
        <ul className="list-disc space-y-0.5 pl-4">
          {errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}
    </Callout>
  );
}
