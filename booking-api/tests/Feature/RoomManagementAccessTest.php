<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Room;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoomManagementAccessTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $slug): User
    {
        $role = Role::create(['name' => $slug, 'slug' => $slug]);
        $unit = Unit::create(['name' => 'FSM', 'code' => 'FSM-' . $slug, 'category' => 'FAKULTAS']);

        return User::factory()->create([
            'role_id' => $role->id,
            'unit_id' => $unit->id,
            'is_profile_completed' => true,
        ]);
    }

    public function test_allowed_roles_can_update_room(): void
    {
        foreach (['admin', 'wadek2', 'manajer-tata-usaha', 'spv-sumberdaya'] as $slug) {
            Sanctum::actingAs($this->userWithRole($slug));
            $room = Room::create(['name' => 'Ruang ' . $slug, 'code' => 'R-' . $slug, 'status' => 'ACTIVE']);

            $this->putJson("/api/rooms/{$room->id}", ['name' => 'Diubah'])->assertOk();
        }
    }

    public function test_borrowers_cannot_update_room(): void
    {
        foreach (['peminjam', 'dosen'] as $slug) {
            Sanctum::actingAs($this->userWithRole($slug));
            $room = Room::create(['name' => 'Ruang ' . $slug, 'code' => 'R-' . $slug, 'status' => 'ACTIVE']);

            $this->putJson("/api/rooms/{$room->id}", ['name' => 'Diubah'])->assertForbidden();
        }
    }
}
