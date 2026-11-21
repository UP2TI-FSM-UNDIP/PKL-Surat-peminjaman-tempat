import { useId, useState } from 'react';
import { ChevronDown, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { BOOKING_RULES } from '@/lib/bookingRules';
import { TimeWheelColumn } from './TimeWheelColumn';

const OPEN_HOUR = Number(BOOKING_RULES.openTime.slice(0, 2));
const CLOSE_HOUR = Number(BOOKING_RULES.closeTime.slice(0, 2));

/** Jam sesuai jam operasional peminjaman (mis. 09-17) */
const HOURS = Array.from({ length: CLOSE_HOUR - OPEN_HOUR + 1 }, (_, i) =>
    (OPEN_HOUR + i).toString().padStart(2, '0'),
);

/** Menit setiap 5 menit: 00, 05, 10, ..., 55 */
const MINUTES = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

interface TimePickerProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    /** Jam awal jika value masih kosong */
    defaultHour?: string;
}

export function TimePicker({ label, value, onChange, disabled, defaultHour = HOURS[0] }: TimePickerProps) {
    const [open, setOpen] = useState(false);
    const labelId = useId();

    const normalized = value?.includes(':') ? value : `${defaultHour}:00`;
    const [rawHour, rawMinute] = normalized.split(':');
    const hour = HOURS.includes(rawHour) ? rawHour : HOURS[0];
    const minute = MINUTES.includes(rawMinute) ? rawMinute : '00';

    return (
        <div className='flex-1'>
            <span id={labelId} className='text-sm'>{label}</span>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type='button'
                        disabled={disabled}
                        aria-labelledby={labelId}
                        aria-haspopup='dialog'
                        aria-expanded={open}
                        className='mt-1 flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50'
                    >
                        <span className='flex items-center gap-2'>
                            <Clock className='h-4 w-4 text-muted-foreground' />
                            <span className='tabular-nums'>{hour}:{minute}</span>
                        </span>
                        <ChevronDown className='h-4 w-4 text-muted-foreground' />
                    </button>
                </PopoverTrigger>
                <PopoverContent align='start' className='w-[280px] p-3'>
                    <div className='grid grid-cols-2 gap-3'>
                        <TimeWheelColumn
                            label='Jam'
                            values={HOURS}
                            value={hour}
                            onChange={(nextHour) => onChange(`${nextHour}:${minute}`)}
                        />
                        <TimeWheelColumn
                            label='Menit'
                            values={MINUTES}
                            value={minute}
                            onChange={(nextMinute) => onChange(`${hour}:${nextMinute}`)}
                        />
                    </div>
                    <Button
                        type='button'
                        size='sm'
                        className='mt-3 w-full'
                        onClick={() => setOpen(false)}
                    >
                        Terapkan
                    </Button>
                </PopoverContent>
            </Popover>
        </div>
    );
}
