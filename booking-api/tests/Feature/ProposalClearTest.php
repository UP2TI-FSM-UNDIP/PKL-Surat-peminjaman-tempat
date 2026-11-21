<?php

namespace Tests\Feature;

use Database\Seeders\BookingPolicySeeder;
use Database\Seeders\WorkflowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\CreatesReservationFixtures;
use Tests\TestCase;

class ProposalClearTest extends TestCase
{
    use RefreshDatabase, CreatesReservationFixtures;

    public function test_proposal_can_clear_text_and_equipment(): void
    {
        $this->seed([BookingPolicySeeder::class, WorkflowSeeder::class]);

        $document = $this->makeDraftReservation();
        $document->update([
            'content' => array_merge($document->content, [
                'event_name' => 'Lama',
                'benefits' => 'Lama',
                'equipment_items' => [['nama' => 'Proyektor', 'jumlah' => 1]],
            ]),
        ]);

        Sanctum::actingAs($document->creator);

        $this->putJson("/api/reservations/{$document->id}/proposal", [
            'content' => [
                'event_name' => '',
                'benefits' => '',
            ],
            'clear_equipment' => '1',
        ])->assertOk();

        $fresh = $document->fresh();

        $this->assertTrue(blank($fresh->content['event_name']));
        $this->assertTrue(blank($fresh->content['benefits']));
        $this->assertSame([], $fresh->content['equipment_items']);
    }
}
