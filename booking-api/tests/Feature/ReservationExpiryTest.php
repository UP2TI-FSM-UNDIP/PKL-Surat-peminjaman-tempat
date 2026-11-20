<?php

namespace Tests\Feature;

use Database\Seeders\BookingPolicySeeder;
use Database\Seeders\WorkflowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\CreatesReservationFixtures;
use Tests\TestCase;

class ReservationExpiryTest extends TestCase
{
    use RefreshDatabase, CreatesReservationFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([BookingPolicySeeder::class, WorkflowSeeder::class]);
    }

    public function test_expiry_cancels_pending_bookings_and_logs_system_action(): void
    {
        $document = $this->makeDraftReservation();
        $document->update(['reservation_deadline' => now('Asia/Jakarta')->subDay()->toDateString()]);

        $this->artisan('reservations:expire')->assertSuccessful();

        $this->assertDatabaseHas('documents', ['id' => $document->id, 'status' => 'EXPIRED']);
        $this->assertDatabaseHas('room_bookings', ['document_id' => $document->id, 'status' => 'CANCELLED']);
        $this->assertDatabaseHas('document_logs', ['document_id' => $document->id, 'action' => 'EXPIRED', 'user_id' => null]);
    }

    public function test_dry_run_does_not_change_status(): void
    {
        $document = $this->makeDraftReservation();
        $document->update(['reservation_deadline' => now('Asia/Jakarta')->subDay()->toDateString()]);

        $this->artisan('reservations:expire --dry-run')->assertSuccessful();

        $this->assertDatabaseHas('documents', ['id' => $document->id, 'status' => 'DRAFT']);
    }

    public function test_complete_proposal_still_expires(): void
    {
        $document = $this->makeCompleteDraftReservation();
        $document->update(['reservation_deadline' => now('Asia/Jakarta')->subDay()->toDateString()]);

        $this->artisan('reservations:expire')->assertSuccessful();

        $this->assertDatabaseHas('documents', ['id' => $document->id, 'status' => 'EXPIRED']);
    }
}
