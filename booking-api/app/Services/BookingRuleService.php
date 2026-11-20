<?php

namespace App\Services;

use App\Models\BookingPolicy;
use App\Models\Room;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

class BookingRuleService
{
    public function __construct(private BookingPolicyService $policies) {}

    public function rulesForDate(CarbonImmutable $date): array
    {
        $policy = $this->policies->active();
        $today = CarbonImmutable::today('Asia/Jakarta');
        $isSunday = $date->isSunday();
        $isSaturday = $date->isSaturday();
        $tooSoon = $date->lt($today->addDays($policy->min_booking_days));

        if ($isSunday || $tooSoon) {
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
            'message' => count($rooms) === 0 ? 'Belum ada ruang yang diizinkan untuk hari kerja.' : null,
        ];
    }

    public function validateSlot(array $slot, BookingPolicy $policy): void
    {
        $date = CarbonImmutable::parse($slot['booking_date'], 'Asia/Jakarta');
        $today = CarbonImmutable::today('Asia/Jakarta');
        $start = $this->minutes($slot['start_time']);
        $end = $this->minutes($slot['end_time']);
        $room = Room::findOrFail($slot['room_id']);

        if ($date->lt($today->addDays($policy->min_booking_days))) {
            throw ValidationException::withMessages(['slots' => ['Tanggal reservasi terlalu dekat.']]);
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
            'message' => $dayType === 'sunday' ? 'Minggu tidak tersedia.' : 'Tanggal terlalu dekat; minimal H-1.',
        ];
    }
}
