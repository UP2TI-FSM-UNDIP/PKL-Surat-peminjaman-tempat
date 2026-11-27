<?php

namespace Tests\Feature;

use App\Models\Document;
use Database\Seeders\BookingPolicySeeder;
use Database\Seeders\WorkflowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\CreatesReservationFixtures;
use Tests\TestCase;

class SelfApprovalSkipTest extends TestCase
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

    private function submitAs(string $slug): Document
    {
        $document = $this->makeCompleteDraftReservation();
        $document->update(['creator_id' => $this->approvers[$slug]->id]);
        Sanctum::actingAs($this->approvers[$slug]);
        $this->postJson("/api/documents/{$document->id}/submit")->assertOk();

        return $document->fresh();
    }

    public function test_spv_submission_skips_own_step_to_mtu(): void
    {
        $document = $this->submitAs('spv-sumberdaya');

        $this->assertSame($this->approvers['manajer-tata-usaha']->id, $document->current_holder_id);
        $this->assertSame(2, $document->current_step_order);
        $this->assertDatabaseHas('document_logs', ['document_id' => $document->id, 'action' => 'SKIPPED', 'step_snapshot' => 1]);
    }

    public function test_mtu_submission_skips_middle_step(): void
    {
        $document = $this->submitAs('manajer-tata-usaha');
        $this->assertSame($this->approvers['spv-sumberdaya']->id, $document->current_holder_id);

        Sanctum::actingAs($this->approvers['spv-sumberdaya']);
        $this->postJson("/api/documents/{$document->id}/approve", ['note' => 'OK'])->assertOk();

        $document->refresh();
        $this->assertSame($this->approvers['wadek2']->id, $document->current_holder_id);
        $this->assertSame(3, $document->current_step_order);
    }

    public function test_wadek_submission_is_final_after_mtu(): void
    {
        $document = $this->submitAs('wadek2');

        foreach (['spv-sumberdaya', 'manajer-tata-usaha'] as $slug) {
            Sanctum::actingAs($this->approvers[$slug]);
            $this->postJson("/api/documents/{$document->id}/approve", ['note' => 'OK'])->assertOk();
        }

        $document->refresh();
        $this->assertSame('APPROVED', $document->status);
        $this->assertNull($document->current_holder_id);
        $this->assertDatabaseHas('document_logs', ['document_id' => $document->id, 'action' => 'SKIPPED', 'step_snapshot' => 3]);
        $this->assertDatabaseHas('room_bookings', ['document_id' => $document->id, 'status' => 'APPROVED']);
    }
}
