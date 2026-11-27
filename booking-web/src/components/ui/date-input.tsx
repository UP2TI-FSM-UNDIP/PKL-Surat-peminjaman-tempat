import { useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, isValid, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDateId } from '@/lib/date';
import { cn } from '@/lib/utils';

interface DateInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
  min?: string;
  max?: string;
  /** Tanggal lain yang tidak boleh dipilih (mis. hari kerja untuk ruang akhir pekan). */
  isDateDisabled?: (date: Date) => boolean;
}

const toDate = (value?: string) => {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
};

/**
 * Input tanggal dengan kalender popover bergaya aplikasi.
 * Input native tetap ada (tersembunyi) agar label, form, dan pengisian otomatis/e2e tetap bekerja.
 */
export function DateInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = 'Pilih tanggal',
  disabled,
  className,
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
  min,
  max,
  isDateDisabled,
}: DateInputProps) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);
  const minDate = toDate(min);
  const maxDate = toDate(max);

  return (
    <div className={cn('relative w-full', className)}>
      <input
        id={id}
        name={name}
        type='date'
        tabIndex={-1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        onFocus={() => !disabled && setOpen(true)}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        min={min}
        max={max}
        className='sr-only'
      />
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) onBlur?.();
        }}
      >
        <PopoverTrigger asChild>
          <button
            type='button'
            disabled={disabled}
            aria-label='Buka kalender'
            aria-invalid={ariaInvalid}
            className={cn(
              'flex h-10 w-full items-center gap-2 rounded-[10px] border border-input bg-white px-3 py-1 text-left text-base transition-[color,box-shadow] outline-none md:text-sm',
              'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
              'aria-invalid:border-destructive',
              open && 'border-ring ring-[3px] ring-ring/50',
              !value && 'text-muted-foreground',
            )}
          >
            <span className='min-w-0 flex-1 truncate'>{value ? formatDateId(value) : placeholder}</span>
            <CalendarDays className='size-4 shrink-0 text-muted-foreground' />
          </button>
        </PopoverTrigger>
        <PopoverContent align='start' className='w-auto rounded-2xl border-black/[0.06] p-3 shadow-[0_12px_32px_rgb(0_0_0/0.12)]'>
          <DayPicker
            mode='single'
            locale={localeId}
            weekStartsOn={1}
            showOutsideDays
            selected={selected}
            defaultMonth={selected ?? minDate}
            disabled={[...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : []), ...(isDateDisabled ? [isDateDisabled] : [])]}
            onSelect={(date) => {
              if (!date) return;
              onChange(format(date, 'yyyy-MM-dd'));
              setOpen(false);
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === 'left' ? <ChevronLeft className='size-4' /> : <ChevronRight className='size-4' />,
            }}
            classNames={{
              root: 'relative',
              months: 'flex flex-col',
              month: 'space-y-2',
              month_caption: 'flex h-8 items-center px-1',
              caption_label: 'text-[14px] font-semibold capitalize',
              nav: 'absolute right-0 top-0 flex items-center gap-1',
              button_previous: 'inline-flex size-8 items-center justify-center rounded-full text-foreground hover:bg-muted disabled:opacity-30',
              button_next: 'inline-flex size-8 items-center justify-center rounded-full text-foreground hover:bg-muted disabled:opacity-30',
              month_grid: 'w-full border-collapse',
              weekdays: 'flex',
              weekday: 'w-9 text-center text-[11px] font-medium uppercase text-muted-foreground',
              week: 'mt-1 flex w-full',
              day: 'size-9 p-0 text-center text-[13px]',
              day_button:
                'inline-flex size-9 items-center justify-center rounded-full tabular-nums transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
              selected: '[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-white [&>button]:hover:bg-primary',
              today: '[&>button]:font-semibold [&:not([data-disabled])>button]:text-primary',
              outside: 'text-muted-foreground/40',
              disabled: 'text-muted-foreground/30 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent',
              hidden: 'invisible',
            }}
          />
          <div className='mt-2 flex justify-between border-t border-border pt-2'>
            <button
              type='button'
              className='rounded-full px-2.5 py-1 text-[13px] font-medium text-muted-foreground hover:bg-muted'
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              Hapus
            </button>
            <button
              type='button'
              className='rounded-full px-2.5 py-1 text-[13px] font-medium text-primary hover:bg-primary/10'
              onClick={() => {
                onChange(format(new Date(), 'yyyy-MM-dd'));
                setOpen(false);
              }}
            >
              Hari ini
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
