<?php

namespace Tests\Feature;

use Database\Seeders\BookingPolicySeeder;
use Database\Seeders\WorkflowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\CreatesReservationFixtures;
use Tests\TestCase;

class BookingCompletionTest extends TestCase
{
    use RefreshDatabase, CreatesReservationFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([BookingPolicySeeder::class, WorkflowSeeder::class]);
    }

    public function test_past_approved_booking_becomes_completed(): void
    {
        $document = $this->makeDraftReservation();
        $booking = $document->roomBookings()->first();
        $booking->update([
            'status' => 'APPROVED',
            'booking_date' => \Carbon\CarbonImmutable::today('Asia/Jakarta')->subDay()->toDateString(),
        ]);

        $this->artisan('bookings:complete')->assertSuccessful();

        $this->assertDatabaseHas('room_bookings', ['id' => $booking->id, 'status' => 'COMPLETED']);
    }
}
