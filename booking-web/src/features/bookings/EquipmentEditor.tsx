import { Controller, useFieldArray, type Control } from 'react-hook-form';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import type { ProposalFormValues } from './proposalForm.types';

interface Props {
  control: Control<ProposalFormValues>;
}

export function EquipmentEditor({ control }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'equipment_items' });
  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-[1fr_110px_44px] gap-2">
          <Controller
            control={control}
            name={`equipment_items.${index}.nama`}
            render={({ field: nameField }) => <Input aria-label="Nama alat" placeholder="Nama alat" value={nameField.value} onChange={nameField.onChange} />}
          />
          <Controller
            control={control}
            name={`equipment_items.${index}.jumlah`}
            render={({ field: amountField }) => (
              <Input aria-label="Jumlah alat" type="number" min={1} value={amountField.value} onChange={(event) => amountField.onChange(Number(event.target.value))} />
            )}
          />
          <Button type="button" variant="ghost" size="icon" aria-label="Hapus alat" onClick={() => remove(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => append({ nama: '', jumlah: 1 })}>Tambah alat</Button>
    </div>
  );
}
