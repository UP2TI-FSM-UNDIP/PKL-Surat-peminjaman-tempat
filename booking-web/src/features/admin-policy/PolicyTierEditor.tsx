import { Controller, useFieldArray, type Control } from 'react-hook-form';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import type { PolicyDraft } from '@/types/booking-policy';

export function PolicyTierEditor({ control }: { control: Control<PolicyDraft> }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'tiers' });
  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <div key={field.id} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_44px]">
          <Controller
            control={control}
            name={`tiers.${index}.min_days_before`}
            render={({ field: input }) => (
              <Input aria-label={`Minimal hari tier ${index + 1}`} type="number" min={1} value={input.value} onChange={(event) => input.onChange(Number(event.target.value))} />
            )}
          />
          <Controller
            control={control}
            name={`tiers.${index}.deadline_offset`}
            render={({ field: input }) => (
              <Input aria-label={`Offset tier ${index + 1}`} type="number" min={1} value={input.value} onChange={(event) => input.onChange(Number(event.target.value))} />
            )}
          />
          <Controller
            control={control}
            name={`tiers.${index}.label`}
            render={({ field: input }) => (
              <Input aria-label={`Label tier ${index + 1}`} placeholder="Label (opsional)" value={input.value ?? ''} onChange={input.onChange} />
            )}
          />
          <Button type="button" variant="ghost" size="icon" aria-label={`Hapus tier ${index + 1}`} onClick={() => remove(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => append({ min_days_before: 1, deadline_offset: 1, label: null })}>Tambah tier</Button>
    </div>
  );
}
