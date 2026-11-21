import { Controller, useWatch, type Control } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { canBukaSekat, type RoomAdjacency } from '@/lib/slotRules';
import type { ReservationWizardValues } from './reservationForm.types';

interface Props {
  control: Control<ReservationWizardValues>;
  roomsById: Record<number, RoomAdjacency | undefined>;
}

export function BukaSekatField({ control, roomsById }: Props) {
  const mode = useWatch({ control, name: 'mode' });
  const slots = useWatch({ control, name: 'slots' }) ?? [];
  if (!canBukaSekat(mode, slots, roomsById)) return null;

  return (
    <Controller
      control={control}
      name="buka_sekat"
      render={({ field }) => (
        <label className="flex items-start gap-2 rounded-md border p-3 text-sm">
          <Checkbox checked={field.value} onCheckedChange={(value) => field.onChange(value === true)} />
          <span>
            <span className="font-medium">Buka Sekat</span>
            <span className="block text-muted-foreground">
              Catatan fasilitas untuk ruang bersebelahan. Kapasitas tidak digabung.
            </span>
          </span>
        </label>
      )}
    />
  );
}
