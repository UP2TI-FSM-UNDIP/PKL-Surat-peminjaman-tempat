<?php

namespace Tests\Feature;

use Database\Seeders\BookingPolicySeeder;
use Database\Seeders\WorkflowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\CreatesReservationFixtures;
use Tests\TestCase;

class AdminManualBookingTest extends TestCase
{
    use RefreshDatabase, CreatesReservationFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([BookingPolicySeeder::class, WorkflowSeeder::class]);
    }

    public function test_admin_manual_booking_is_approved_without_proposal(): void
    {
        $admin = $this->userWithRole('admin');
        Sanctum::actingAs($admin);
        $room = \App\Models\Room::firstOrCreate(['code' => 'F107'], [
            'name' => 'F107', 'status' => 'ACTIVE', 'is_bookable_weekday' => true, 'weekday_max_end_time' => '16:30',
        ]);

        $this->postJson('/api/reservations', [
            'mode' => 'one_room_many_dates',
            'slots' => [['room_id' => $room->id, 'booking_date' => \Carbon\CarbonImmutable::today('Asia/Jakarta')->addDays(11)->toDateString(), 'start_time' => '09:00', 'end_time' => '12:00']],
            'purpose' => 'Manual',
            'ketua_pelaksana_nama' => 'Admin',
            'ketua_pelaksana_identitas' => '197001011995031001',
            'ketua_pelaksana_hp' => '081234567890',
            'intent' => 'submit',
        ])->assertCreated();

        $this->assertDatabaseHas('documents', ['status' => 'APPROVED', 'title' => 'Manual']);
        $this->assertDatabaseHas('room_bookings', ['status' => 'APPROVED']);
    }
}
