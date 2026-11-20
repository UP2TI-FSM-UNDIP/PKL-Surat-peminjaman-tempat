<?php

namespace Tests\Feature;

use Database\Seeders\BookingPolicySeeder;
use Database\Seeders\WorkflowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\CreatesReservationFixtures;
use Tests\TestCase;

class ApprovalUmumTest extends TestCase
{
    use RefreshDatabase, CreatesReservationFixtures;

    /** @var array<string, \App\Models\User> */
    private array $approvers = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([BookingPolicySeeder::class, WorkflowSeeder::class]);

        foreach (['spv-sumberdaya', 'manajer-tata-usaha', 'wadek2'] as $slug) {
            $this->approvers[$slug] = $this->userWithRole($slug);
        }
    }

    public function test_umum_flow_reaches_approved_without_signature(): void
    {
        $document = $this->makeCompleteDraftReservation();
        Sanctum::actingAs($document->creator);
        $this->postJson("/api/documents/{$document->id}/submit")->assertOk();
        $this->assertDatabaseHas('documents', ['id' => $document->id, 'status' => 'IN_PROGRESS']);

        foreach ($this->approvers as $approver) {
            Sanctum::actingAs($approver);
            $this->postJson("/api/documents/{$document->id}/approve", ['note' => 'OK'])->assertOk();
        }

        $this->assertDatabaseHas('documents', ['id' => $document->id, 'status' => 'APPROVED']);
        $this->assertDatabaseHas('room_bookings', ['document_id' => $document->id, 'status' => 'APPROVED']);

        $booking = $document->roomBookings()->first();
        Sanctum::actingAs($document->creator);
        $this->getJson("/api/room-bookings/{$booking->id}/receipt")->assertOk();
    }
}
