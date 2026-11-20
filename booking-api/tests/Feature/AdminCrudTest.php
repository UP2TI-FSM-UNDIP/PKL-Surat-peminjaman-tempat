<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\Role;
use App\Models\Unit;
use App\Models\User;
use App\Models\Workflow;
use Database\Seeders\BookingPolicySeeder;
use Database\Seeders\WorkflowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $peminjam;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([BookingPolicySeeder::class, WorkflowSeeder::class]);

        $this->admin = $this->userWithRole('admin');
        $this->peminjam = $this->userWithRole('peminjam');
    }

    private function userWithRole(string $slug): User
    {
        $role = Role::firstOrCreate(['slug' => $slug], ['name' => $slug]);
        $unit = Unit::firstOrCreate(['code' => 'FSM'], ['name' => 'FSM', 'category' => 'FAKULTAS']);

        return User::factory()->create([
            'role_id' => $role->id,
            'unit_id' => $unit->id,
            'is_profile_completed' => true,
        ]);
    }

    private function unit(string $code = 'UNIT-UJI', ?int $parentId = null): Unit
    {
        return Unit::create([
            'name' => 'Unit ' . $code,
            'code' => $code,
            'category' => 'DEPARTEMEN',
            'parent_id' => $parentId,
        ]);
    }

    public function test_admin_can_create_unit(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/units', [
            'name' => 'Unit Baru',
            'code' => 'UNIT-BARU',
            'category' => 'DEPARTEMEN',
        ])->assertCreated()->assertJsonPath('success', true);
    }

    public function test_non_admin_cannot_create_unit(): void
    {
        Sanctum::actingAs($this->peminjam);

        $this->postJson('/api/units', [
            'name' => 'Unit Baru',
            'code' => 'UNIT-BARU',
            'category' => 'DEPARTEMEN',
        ])->assertForbidden();
    }

    public function test_unit_with_users_cannot_be_deleted(): void
    {
        $unit = $this->unit();
        User::factory()->create(['unit_id' => $unit->id]);

        Sanctum::actingAs($this->admin);
        $this->deleteJson("/api/units/{$unit->id}")->assertStatus(400);
    }

    public function test_unit_with_children_cannot_be_deleted(): void
    {
        $parent = $this->unit('PARENT');
        $this->unit('CHILD', $parent->id);

        Sanctum::actingAs($this->admin);
        $this->deleteJson("/api/units/{$parent->id}")->assertStatus(400);
    }

    public function test_admin_can_create_user(): void
    {
        Sanctum::actingAs($this->admin);
        $role = Role::where('slug', 'peminjam')->firstOrFail();
        $unit = Unit::where('code', 'FSM')->firstOrFail();

        $this->postJson('/api/users', [
            'name' => 'User Baru',
            'email' => 'user.baru@example.test',
            'password' => 'password123',
            'role_id' => $role->id,
            'unit_id' => $unit->id,
        ])->assertCreated()->assertJsonPath('success', true);
    }

    public function test_non_admin_cannot_create_user(): void
    {
        Sanctum::actingAs($this->peminjam);
        $role = Role::where('slug', 'peminjam')->firstOrFail();
        $unit = Unit::where('code', 'FSM')->firstOrFail();

        $this->postJson('/api/users', [
            'name' => 'User Baru',
            'email' => 'user.baru@example.test',
            'password' => 'password123',
            'role_id' => $role->id,
            'unit_id' => $unit->id,
        ])->assertForbidden();
    }

    public function test_admin_cannot_delete_own_account(): void
    {
        Sanctum::actingAs($this->admin);
        $this->deleteJson("/api/users/{$this->admin->id}")->assertStatus(400);
    }

    public function test_user_holding_active_document_cannot_be_deleted(): void
    {
        $workflow = Workflow::where('applies_to_category', 'UMUM')->firstOrFail();
        $holder = $this->userWithRole('spv-sumberdaya');

        Document::create([
            'title' => 'Dokumen Uji',
            'unit_id' => $holder->unit_id,
            'creator_id' => $this->peminjam->id,
            'workflow_id' => $workflow->id,
            'current_step_order' => 1,
            'current_holder_id' => $holder->id,
            'status' => 'IN_PROGRESS',
        ]);

        Sanctum::actingAs($this->admin);
        $this->deleteJson("/api/users/{$holder->id}")->assertStatus(400);
    }

    public function test_admin_can_list_and_show_role(): void
    {
        Sanctum::actingAs($this->admin);
        $role = Role::where('slug', 'peminjam')->firstOrFail();

        $this->getJson('/api/roles')->assertOk()->assertJsonPath('success', true);
        $this->getJson("/api/roles/{$role->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $role->id);
    }

    public function test_admin_can_read_dashboard_stats(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/admin/dashboard/stats')
            ->assertOk()
            ->assertJsonStructure([
                'data' => ['pending_approvals', 'active_rooms', 'total_users'],
            ]);
    }

    public function test_borrower_cannot_read_dashboard_stats(): void
    {
        Sanctum::actingAs($this->peminjam);
        $this->getJson('/api/admin/dashboard/stats')->assertForbidden();
    }

    public function test_admin_can_use_policy_endpoints(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/admin/booking-policy')->assertOk();

        $this->postJson('/api/admin/booking-policy/preview', [
            'name' => 'Preview',
            'min_booking_days' => 1,
            'max_dates_per_room' => 10,
            'max_rooms_per_date' => 5,
            'tiers' => [
                ['min_days_before' => 15, 'deadline_offset' => 14],
            ],
            'date' => '2026-12-01',
        ])->assertOk();

        $this->getJson('/api/admin/booking-policy/audits')->assertOk();
        $this->postJson('/api/admin/booking-policy/recalculate', ['dry_run' => true])
            ->assertOk();
    }
}
