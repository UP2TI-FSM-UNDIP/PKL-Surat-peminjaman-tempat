<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingPolicyRecalculateTest extends TestCase
{
    use RefreshDatabase;

    public function test_recalculate_dry_run_does_not_write_documents(): void
    {
        $role = \App\Models\Role::create(['name' => 'Admin', 'slug' => 'admin']);
        $unit = \App\Models\Unit::create(['name' => 'FSM', 'code' => 'FSM', 'category' => 'FAKULTAS']);
        $admin = \App\Models\User::factory()->create(['role_id' => $role->id, 'unit_id' => $unit->id]);
        $service = app(\App\Services\BookingPolicyService::class);
        $service->save([
            'name' => 'Uji', 'min_booking_days' => 1, 'max_dates_per_room' => 10, 'max_rooms_per_date' => 5,
            'tiers' => [['min_days_before' => 15, 'deadline_offset' => 14], ['min_days_before' => 1, 'deadline_offset' => 1]],
        ], $admin);

        $result = $service->recalculate(true, null, $admin);

        $this->assertTrue($result['dry_run']);
        $this->assertSame(0, $result['count']);
    }
}
