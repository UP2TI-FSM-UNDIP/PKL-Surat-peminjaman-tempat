<?php

namespace Tests\Feature;

use App\Models\BookingPolicy;
use App\Services\BookingPolicyService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingPolicySnapshotTest extends TestCase
{
    use RefreshDatabase;

    public function test_existing_deadline_is_not_changed_by_new_policy(): void
    {
        $service = app(BookingPolicyService::class);
        $role = \App\Models\Role::create(['name' => 'Admin', 'slug' => 'admin']);
        $unit = \App\Models\Unit::create(['name' => 'FSM', 'code' => 'FSM', 'category' => 'FAKULTAS']);
        $actor = \App\Models\User::factory()->create([
            'role_id' => $role->id,
            'unit_id' => $unit->id,
        ]);

        $old = $service->save([
            'name' => 'Lama',
            'min_booking_days' => 1,
            'max_dates_per_room' => 10,
            'max_rooms_per_date' => 5,
            'tiers' => [
                ['min_days_before' => 15, 'deadline_offset' => 14],
                ['min_days_before' => 1, 'deadline_offset' => 1],
            ],
        ], $actor);

        $computed = $service->computeDeadline(
            CarbonImmutable::parse('2026-11-20'),
            CarbonImmutable::parse('2026-12-05')
        );

        $this->assertSame($old->id, $computed['policy_id']);
        $this->assertSame('2026-11-21', $computed['computed_deadline']);

        $service->save([
            'name' => 'Baru',
            'min_booking_days' => 1,
            'max_dates_per_room' => 10,
            'max_rooms_per_date' => 5,
            'tiers' => [
                ['min_days_before' => 15, 'deadline_offset' => 10],
                ['min_days_before' => 1, 'deadline_offset' => 1],
            ],
        ], $actor);

        $this->assertSame('2026-11-21', $computed['computed_deadline']);
    }
}
