import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const OPTIONS = Array.from({ length: (21 - 6) * 2 + 1 }, (_, index) => {
  const minutes = 6 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

/** Pilihan jam 24 jam per 30 menit (06.00–21.00); jam di luar batas dinonaktifkan. */
export function TimeSelect({ value, onChange, min, max, label }: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  label: string;
}) {
  const options = OPTIONS.includes(value) || !value ? OPTIONS : [...OPTIONS, value].sort();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-full! min-w-0 tabular-nums"><SelectValue placeholder="--:--" /></SelectTrigger>
      <SelectContent position="popper" className="max-h-64">
        {options.map((time) => (
          <SelectItem key={time} value={time} disabled={(min !== undefined && time < min) || (max !== undefined && time > max)} className="tabular-nums">
            {time.replace(':', '.')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
