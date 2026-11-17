import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { BOOKING_RULES } from '@/lib/bookingRules';

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
    const [hour, minute] = value ? value.split(':') : [defaultHour, '00'];
    return (
        <div className='flex-1'>
            <label className='text-sm'>{label}</label>
            <div className='flex gap-2'>
                <Select
                    value={hour || defaultHour}
                    onValueChange={(h) => onChange(`${h}:${minute || '00'}`)}
                    disabled={disabled}
                >
                    <SelectTrigger className='w-full' aria-label={`${label} - jam`}>
                        <SelectValue placeholder='Jam' />
                    </SelectTrigger>
                    <SelectContent position='popper' className='max-h-60'>
                        {HOURS.map((h) => (
                            <SelectItem key={h} value={h}>
                                {h}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={minute || '00'}
                    onValueChange={(m) => onChange(`${hour || defaultHour}:${m}`)}
                    disabled={disabled}
                >
                    <SelectTrigger className='w-full' aria-label={`${label} - menit`}>
                        <SelectValue placeholder='Menit' />
                    </SelectTrigger>
                    <SelectContent position='popper' className='max-h-60'>
                        {MINUTES.map((m) => (
                            <SelectItem key={m} value={m}>
                                {m}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
