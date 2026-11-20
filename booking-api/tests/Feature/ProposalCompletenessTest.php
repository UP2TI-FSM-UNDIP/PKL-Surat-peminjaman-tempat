<?php

namespace Tests\Feature;

use Database\Seeders\BookingPolicySeeder;
use Database\Seeders\WorkflowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\CreatesReservationFixtures;
use Tests\TestCase;

class ProposalCompletenessTest extends TestCase
{
    use RefreshDatabase, CreatesReservationFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([BookingPolicySeeder::class, WorkflowSeeder::class]);
    }

    public function test_complete_proposal_sets_timestamp(): void
    {
        $document = $this->makeDraftReservation();
        \Illuminate\Support\Facades\Storage::fake('private');
        \Illuminate\Support\Facades\Storage::disk('private')->put('documents/proposals/test.pdf', '%PDF-1.4 test');
        $document->update(['file_proposal' => 'documents/proposals/test.pdf']);
        $document->update(['content' => array_merge($document->content, [
            'event_name' => 'Seminar',
            'event_nature' => 'Akademik',
            'event_form' => 'Offline',
            'objectives' => 'Tujuan',
            'benefits' => 'Manfaat',
            'target_audience' => 'Mahasiswa',
            'ketua_pelaksana_nama' => 'Ketua',
            'ketua_pelaksana_identitas' => '24060121120001',
            'ketua_pelaksana_hp' => '081234567890',
            'equipment_items' => [['nama' => 'Proyektor', 'jumlah' => 1]],
        ])]);

        $result = app(\App\Services\ProposalCompletenessService::class)->sync($document);

        $this->assertNotNull($result->proposal_completed_at);
    }
}
