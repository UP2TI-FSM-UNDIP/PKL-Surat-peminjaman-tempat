<?php

namespace App\Services;

use App\Models\BookingPolicy;
use App\Models\Room;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

class BookingRuleService
{
    /**
     * Pinjam di hari yang sama (H-0) hanya lewat Ajukan Pinjam, dan jam mulai
     * paling cepat sekian menit dari sekarang.
     */
    public const SAME_DAY_LEAD_MINUTES = 60;

    public function __construct(private BookingPolicyService $policies) {}

    /** Jam mulai paling cepat untuk pinjam hari ini, dibulatkan ke 5 menit ke atas. */
    public function sameDayEarliestStart(): string
    {
        $earliest = CarbonImmutable::now('Asia/Jakarta')->addMinutes(self::SAME_DAY_LEAD_MINUTES);
        $minutes = (int) (ceil((($earliest->hour * 60) + $earliest->minute + ($earliest->second > 0 ? 1 : 0)) / 5) * 5);

        return sprintf('%02d:%02d', intdiv(min($minutes, 1439), 60), min($minutes, 1439) % 60);
    }

    public function rulesForDate(CarbonImmutable $date): array
    {
        $policy = $this->policies->active();
        $today = CarbonImmutable::today('Asia/Jakarta');
        $isSunday = $date->isSunday();
        $isSaturday = $date->isSaturday();
        $isPast = $date->lt($today);
        $tooSoon = $date->lt($today->addDays($policy->min_booking_days));
        // H-0 tetap terbuka, tetapi hanya untuk Ajukan Pinjam (proposal lengkap).
        $sameDay = $tooSoon && $date->isSameDay($today);

        if ($isPast) {
            return $this->emptyPayload($date, $policy, 'past');
        }
        if ($isSunday || ($tooSoon && !$sameDay)) {
            return $this->emptyPayload($date, $policy, $isSunday ? 'sunday' : 'too_soon');
        }

        $rooms = Room::where('status', 'ACTIVE')
            ->when(!$isSaturday, fn ($q) => $q->where('is_bookable_weekday', true))
            ->orderBy('code')
            ->get()
            ->map(fn (Room $room) => [
                'id' => $room->id,
                'code' => $room->code,
                'name' => $room->name,
                'type' => $room->type,
                'capacity' => $room->capacity,
                'max_end_time' => $isSaturday ? '17:00' : ($room->weekday_max_end_time ?? '16:30'),
            ])
            ->values()
            ->all();

        return [
            'date' => $date->toDateString(),
            'day_type' => $isSaturday ? 'saturday' : 'weekday',
            'is_bookable' => count($rooms) > 0,
            'open_time' => '09:00',
            'min_booking_days' => $policy->min_booking_days,
            'rooms' => $rooms,
            'limits' => [
                'max_dates_per_room' => $policy->max_dates_per_room,
                'max_rooms_per_date' => $policy->max_rooms_per_date,
                'max_total_room_hours' => $policy->max_total_room_hours,
            ],
            'message' => count($rooms) === 0
                ? 'Belum ada ruang yang diizinkan untuk hari kerja.'
                : ($sameDay ? 'Hari ini hanya bisa lewat Ajukan Pinjam (proposal sudah lengkap).' : null),
            'same_day' => $sameDay,
            'min_start_time' => $sameDay ? $this->sameDayEarliestStart() : null,
        ];
    }

    /**
     * @param  bool  $direct  true untuk Ajukan Pinjam (alur langsung sampai diajukan);
     *                        hanya alur ini yang boleh memakai tanggal hari ini.
     */
    public function validateSlot(array $slot, BookingPolicy $policy, bool $direct = false): void
    {
        $date = CarbonImmutable::parse($slot['booking_date'], 'Asia/Jakarta');
        $today = CarbonImmutable::today('Asia/Jakarta');
        $start = $this->minutes($slot['start_time']);
        $end = $this->minutes($slot['end_time']);
        $room = Room::findOrFail($slot['room_id']);

        if ($date->lt($today)) {
            throw ValidationException::withMessages(['slots' => ['Tanggal reservasi sudah lewat.']]);
        }
        $sameDay = $date->isSameDay($today) && $policy->min_booking_days > 0;
        if ($sameDay && !$direct) {
            throw ValidationException::withMessages(['slots' => ['Tanggal hari ini hanya bisa lewat Ajukan Pinjam.']]);
        }
        if (!$sameDay && $date->lt($today->addDays($policy->min_booking_days))) {
            throw ValidationException::withMessages(['slots' => ['Tanggal reservasi terlalu dekat.']]);
        }
        if ($sameDay && $this->minutes($slot['start_time']) < $this->minutes($this->sameDayEarliestStart())) {
            throw ValidationException::withMessages(['slots' => ['Pinjam hari ini: jam mulai paling cepat '.$this->sameDayEarliestStart().'.']]);
        }
        if ($date->isSunday()) {
            throw ValidationException::withMessages(['slots' => ['Minggu tidak tersedia.']]);
        }
        if ($room->status !== 'ACTIVE') {
            throw ValidationException::withMessages(['slots' => ["Ruang {$room->code} tidak aktif."]]);
        }
        if (!$date->isSaturday() && !$room->is_bookable_weekday) {
            throw ValidationException::withMessages(['slots' => ["Ruang {$room->code} tidak dibuka untuk hari kerja."]]);
        }

        $maxEnd = $date->isSaturday() ? 17 * 60 : $this->minutes($room->weekday_max_end_time ?? '16:30');
        if ($start < 9 * 60 || $end > $maxEnd || $end <= $start) {
            throw ValidationException::withMessages(['slots' => ["Jam ruang {$room->code} tidak valid."]]);
        }
    }

    private function minutes(string $time): int
    {
        [$h, $m] = explode(':', substr($time, 0, 5));
        return ((int) $h * 60) + (int) $m;
    }

    private function emptyPayload(CarbonImmutable $date, BookingPolicy $policy, string $dayType): array
    {
        return [
            'date' => $date->toDateString(),
            'day_type' => $dayType,
            'is_bookable' => false,
            'open_time' => null,
            'min_booking_days' => $policy->min_booking_days,
            'rooms' => [],
            'limits' => [
                'max_dates_per_room' => $policy->max_dates_per_room,
                'max_rooms_per_date' => $policy->max_rooms_per_date,
                'max_total_room_hours' => $policy->max_total_room_hours,
            ],
            'message' => match ($dayType) {
                'past' => 'Tanggal sudah lewat.',
                'sunday' => 'Minggu tidak tersedia.',
                default => "Tanggal terlalu dekat; minimal H-{$policy->min_booking_days}.",
            },
            'same_day' => false,
            'min_start_time' => null,
        ];
    }
}
