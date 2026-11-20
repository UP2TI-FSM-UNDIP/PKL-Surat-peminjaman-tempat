<?php

namespace Tests\Feature;

use Database\Seeders\BookingPolicySeeder;
use Database\Seeders\WorkflowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\CreatesReservationFixtures;
use Tests\TestCase;

class ReadOnlyReservationTest extends TestCase
{
    use RefreshDatabase, CreatesReservationFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([BookingPolicySeeder::class, WorkflowSeeder::class]);
    }

    public function test_reservation_fields_cannot_change(): void
    {
        $document = $this->makeDraftReservation();
        Sanctum::actingAs($document->creator);
        $this->putJson("/api/reservations/{$document->id}/proposal", [
                'content' => ['start_time' => '10:00'],
            ])
            ->assertStatus(422);
    }
}
