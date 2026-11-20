<?php

namespace Tests\Feature;

use App\Models\Document;
use Database\Seeders\BookingPolicySeeder;
use Database\Seeders\WorkflowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\CreatesReservationFixtures;
use Tests\TestCase;

class DocumentAuthorizationTest extends TestCase
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

    public function test_non_creator_cannot_submit_document(): void
    {
        $document = $this->makeCompleteDraftReservation();
        $other = $this->userWithRole('peminjam');

        Sanctum::actingAs($other);
        $this->postJson("/api/documents/{$document->id}/submit")->assertForbidden();
    }

    public function test_non_holder_cannot_approve_document(): void
    {
        $document = $this->submittedDocument();

        Sanctum::actingAs($this->approvers['manajer-tata-usaha']);
        $this->postJson("/api/documents/{$document->id}/approve", ['note' => 'OK'])
            ->assertForbidden();
    }

    public function test_non_holder_cannot_reject_document(): void
    {
        $document = $this->submittedDocument();

        Sanctum::actingAs($this->approvers['manajer-tata-usaha']);
        $this->postJson("/api/documents/{$document->id}/reject", [
            'note' => 'Alasan penolakan',
        ])->assertForbidden();
    }

    public function test_non_holder_cannot_revise_document(): void
    {
        $document = $this->submittedDocument();

        Sanctum::actingAs($this->approvers['manajer-tata-usaha']);
        $this->postJson("/api/documents/{$document->id}/revise", [
            'note' => 'Perbaiki proposal',
        ])->assertForbidden();
    }

    public function test_reject_note_shorter_than_ten_characters_is_rejected(): void
    {
        $document = $this->submittedDocument();

        Sanctum::actingAs($this->approvers['spv-sumberdaya']);
        $this->postJson("/api/documents/{$document->id}/reject", ['note' => 'pendek'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('note');
    }

    public function test_creator_cannot_submit_approved_document(): void
    {
        $document = $this->makeCompleteDraftReservation();
        $document->update(['status' => 'APPROVED']);

        Sanctum::actingAs($document->creator);
        $this->postJson("/api/documents/{$document->id}/submit")->assertStatus(400);
    }

    private function submittedDocument(): Document
    {
        $document = $this->makeCompleteDraftReservation();

        Sanctum::actingAs($document->creator);
        $this->postJson("/api/documents/{$document->id}/submit")->assertOk();

        return $document->fresh();
    }
}
