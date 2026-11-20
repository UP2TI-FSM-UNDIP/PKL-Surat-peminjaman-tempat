<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Unit;
use App\Models\User;
use App\Models\Workflow;
use Database\Seeders\WorkflowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class WorkflowAdminTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $peminjam;

    private Workflow $umum;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(WorkflowSeeder::class);

        $this->umum = Workflow::where('applies_to_category', 'UMUM')->firstOrFail();
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

    public function test_non_umum_workflow_cannot_be_updated(): void
    {
        $workflow = Workflow::create([
            'name' => 'Workflow HMD',
            'applies_to_category' => 'HMD',
        ]);

        Sanctum::actingAs($this->admin);
        $this->putJson("/api/workflows/{$workflow->id}", ['name' => 'Baru'])
            ->assertStatus(422);
    }

    public function test_non_admin_cannot_add_step(): void
    {
        Sanctum::actingAs($this->peminjam);

        $this->postJson("/api/workflows/{$this->umum->id}/steps", [
            'step_order' => 4,
            'step_name' => 'Langkah Baru',
            'target_role_slug' => 'dosen',
            'scope_type' => 'FACULTY_LEADER',
        ])->assertForbidden();
    }

    public function test_admin_can_add_step(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson("/api/workflows/{$this->umum->id}/steps", [
            'step_order' => 4,
            'step_name' => 'Langkah Baru',
            'target_role_slug' => 'dosen',
            'scope_type' => 'FACULTY_LEADER',
        ])->assertCreated()->assertJsonPath('data.step_order', 4);
    }

    public function test_admin_can_update_step(): void
    {
        $step = $this->umum->steps()->firstOrFail();

        Sanctum::actingAs($this->admin);
        $this->putJson("/api/workflows/{$this->umum->id}/steps/{$step->id}", [
            'step_name' => 'Nama Baru',
        ])->assertOk()->assertJsonPath('data.step_name', 'Nama Baru');
    }

    public function test_admin_can_delete_step(): void
    {
        $step = $this->umum->steps()->where('step_order', 3)->firstOrFail();

        Sanctum::actingAs($this->admin);
        $this->deleteJson("/api/workflows/{$this->umum->id}/steps/{$step->id}")
            ->assertOk();

        $this->assertDatabaseMissing('workflow_steps', ['id' => $step->id]);
    }
}
