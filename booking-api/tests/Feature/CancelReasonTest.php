<?php

namespace Tests\Feature;

use Database\Seeders\BookingPolicySeeder;
use Database\Seeders\WorkflowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\CreatesReservationFixtures;
use Tests\TestCase;

class CancelReasonTest extends TestCase
{
    use RefreshDatabase, CreatesReservationFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([BookingPolicySeeder::class, WorkflowSeeder::class]);
    }

    public function test_cancel_marks_document_and_pending_bookings(): void
    {
        $document = $this->makeDraftReservation();
        Sanctum::actingAs($document->creator);

        $this->postJson("/api/reservations/{$document->id}/cancel", ['reason' => 'Batal'])->assertOk();

        $this->assertDatabaseHas('documents', ['id' => $document->id, 'status' => 'CANCELLED']);
        $this->assertDatabaseHas('room_bookings', ['document_id' => $document->id, 'status' => 'CANCELLED', 'rejection_reason' => 'Batal']);
        $this->assertDatabaseHas('document_logs', ['document_id' => $document->id, 'action' => 'CANCELLED']);
    }
}
