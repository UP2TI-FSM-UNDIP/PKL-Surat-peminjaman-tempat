<?php

namespace Tests\Feature;

use App\Services\BookingPolicyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class BookingPolicyValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_last_tier_must_equal_min_booking_days(): void
    {
        $this->expectException(ValidationException::class);

        app(BookingPolicyService::class)->validatePayload([
            'name' => 'Uji',
            'min_booking_days' => 1,
            'max_dates_per_room' => 10,
            'max_rooms_per_date' => 5,
            'tiers' => [
                ['min_days_before' => 15, 'deadline_offset' => 14],
                ['min_days_before' => 2, 'deadline_offset' => 1],
            ],
        ]);
    }

    public function test_deadline_offset_cannot_exceed_threshold(): void
    {
        $this->expectException(ValidationException::class);

        app(BookingPolicyService::class)->validatePayload([
            'name' => 'Uji',
            'min_booking_days' => 1,
            'max_dates_per_room' => 10,
            'max_rooms_per_date' => 5,
            'tiers' => [
                ['min_days_before' => 15, 'deadline_offset' => 16],
                ['min_days_before' => 1, 'deadline_offset' => 1],
            ],
        ]);
    }
}
