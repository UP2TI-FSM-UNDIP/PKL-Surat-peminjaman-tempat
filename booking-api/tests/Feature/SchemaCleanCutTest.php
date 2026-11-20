<?php

namespace Tests\Feature;

use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SchemaCleanCutTest extends TestCase
{
    use RefreshDatabase;

    public function test_clean_cut_schema_is_applied(): void
    {
        $this->assertTrue(Schema::hasTable('booking_policies'));
        $this->assertTrue(Schema::hasTable('booking_policy_tiers'));
        $this->assertTrue(Schema::hasTable('booking_policy_audits'));
        $this->assertFalse(Schema::hasTable('signs'));
        $this->assertFalse(Schema::hasTable('document_templates'));

        $this->assertTrue(Schema::hasColumn('documents', 'proposal_completed_at'));
        $this->assertTrue(Schema::hasColumn('documents', 'reservation_deadline'));
        $this->assertTrue(Schema::hasColumn('documents', 'expired_at'));
        $this->assertTrue(Schema::hasColumn('documents', 'cancelled_at'));
        $this->assertTrue(Schema::hasColumn('documents', 'deadline_policy_id'));
        $this->assertFalse(Schema::hasColumn('documents', 'nomor_surat'));
        $this->assertFalse(Schema::hasColumn('documents', 'file_executive_summary'));
        $this->assertFalse(Schema::hasColumn('documents', 'file_approval_sheet'));

        $this->assertTrue(Schema::hasColumn('room_bookings', 'slot_index'));
        $this->assertTrue(Schema::hasColumn('room_bookings', 'is_sekat'));
        $this->assertTrue(Schema::hasColumn('room_bookings', 'cancelled_at'));
        $this->assertTrue(Schema::hasColumn('room_bookings', 'cancelled_by'));

        $this->assertDatabaseMissing('roles', ['slug' => 'menunggu-penetapan']);

        $unit = Unit::create([
            'name' => 'Fakultas Sains dan Matematika',
            'code' => 'FSM',
            'category' => 'FAKULTAS',
        ]);
        $user = User::factory()->create([
            'role_id' => null,
            'unit_id' => $unit->id,
        ]);
        $this->assertNull($user->fresh()->role_id);
    }
}
