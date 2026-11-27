import { Controller, useFieldArray, type Control } from 'react-hook-form';
import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import type { ProposalFormValues } from './proposalForm.types';

interface Props {
  control: Control<ProposalFormValues>;
}

export function EquipmentEditor({ control }: Props) {
  const { fields, append, remove } = useFieldArray({ control, name: 'equipment_items' });
  return (
    <div className="space-y-2">
      {fields.length === 0 && <p className="text-[13px] text-muted-foreground">Belum ada alat. Tambahkan bila perlu.</p>}
      {fields.length > 0 && (
        <div className="grid grid-cols-[1fr_110px_36px] gap-2 px-3 text-xs font-medium text-muted-foreground">
          <span>Nama alat</span><span>Jumlah</span><span />
        </div>
      )}
      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-[1fr_110px_36px] items-center gap-2 rounded-xl bg-muted/70 p-2">
          <Controller
            control={control}
            name={`equipment_items.${index}.nama`}
            render={({ field: nameField }) => <Input aria-label="Nama alat" placeholder="Contoh: Proyektor" value={nameField.value} onChange={nameField.onChange} />}
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
      <Button type="button" variant="outline" className="gap-1.5" onClick={() => append({ nama: '', jumlah: 1 })}><Plus className="size-4" />Tambah alat</Button>
    </div>
  );
}
