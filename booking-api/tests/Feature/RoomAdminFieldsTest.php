<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Room;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoomAdminFieldsTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $role = Role::create(['name' => 'Admin', 'slug' => 'admin']);
        $unit = Unit::create([
            'name' => 'Fakultas Sains dan Matematika',
            'code' => 'FAKULTAS',
            'category' => 'FAKULTAS',
        ]);

        return User::factory()->create([
            'role_id' => $role->id,
            'unit_id' => $unit->id,
            'is_profile_completed' => true,
        ]);
    }

    public function test_admin_dapat_menyimpan_field_weekday_dan_nilai_null(): void
    {
        Sanctum::actingAs($this->admin());

        $room = Room::create([
            'name' => 'Ruang Uji',
            'code' => 'UJI-01',
            'capacity' => null,
            'status' => 'ACTIVE',
        ]);

        $response = $this->putJson("/api/rooms/{$room->id}", [
            'type' => 'SIDANG',
            'is_bookable_weekday' => true,
            'weekday_max_end_time' => '18:00',
            'adjacent_group' => 'A1',
            'adjacent_position' => 1,
            'capacity' => null,
            'status' => 'MAINTENANCE',
        ]);

        $response->assertOk()
            ->assertJsonPath('data.type', 'SIDANG')
            ->assertJsonPath('data.is_bookable_weekday', true)
            ->assertJsonPath('data.weekday_max_end_time', '18:00')
            ->assertJsonPath('data.capacity', null)
            ->assertJsonPath('data.status', 'MAINTENANCE');

        $this->assertArrayNotHasKey('weekday_seeded_at', $response->json('data'));

        $this->getJson('/api/rooms')
            ->assertOk()
            ->assertJsonFragment([
                'code' => 'UJI-01',
                'weekday_max_end_time' => '18:00',
            ]);

        $this->getJson("/api/rooms/{$room->id}")
            ->assertOk()
            ->assertJsonPath('data.room.adjacent_group', 'A1')
            ->assertJsonPath('data.room.adjacent_position', 1);
    }

    public function test_admin_dapat_mengosongkan_field_weekday(): void
    {
        Sanctum::actingAs($this->admin());

        $room = Room::create([
            'name' => 'Ruang Uji',
            'code' => 'UJI-02',
            'capacity' => null,
            'status' => 'ACTIVE',
            'type' => 'SIDANG',
            'is_bookable_weekday' => true,
            'weekday_max_end_time' => '16:30',
            'adjacent_group' => 'A1',
            'adjacent_position' => 1,
        ]);

        $this->putJson("/api/rooms/{$room->id}", [
            'type' => null,
            'weekday_max_end_time' => null,
            'adjacent_group' => null,
            'adjacent_position' => null,
        ])->assertOk()
            ->assertJsonPath('data.type', null)
            ->assertJsonPath('data.weekday_max_end_time', null)
            ->assertJsonPath('data.adjacent_group', null)
            ->assertJsonPath('data.adjacent_position', null);
    }

    public function test_pengguna_biasa_tidak_boleh_mengubah_ruang(): void
    {
        $role = Role::create(['name' => 'Peminjam', 'slug' => 'peminjam']);
        $unit = Unit::create([
            'name' => 'Fakultas Sains dan Matematika',
            'code' => 'FAKULTAS',
            'category' => 'FAKULTAS',
        ]);
        $user = User::factory()->create([
            'role_id' => $role->id,
            'unit_id' => $unit->id,
            'is_profile_completed' => true,
        ]);
        Sanctum::actingAs($user);

        $room = Room::create([
            'name' => 'Ruang Uji',
            'code' => 'UJI-03',
            'capacity' => 10,
            'status' => 'ACTIVE',
        ]);

        $this->putJson("/api/rooms/{$room->id}", ['name' => 'Diubah'])
            ->assertForbidden();
    }

    public function test_tanpa_autentikasi_mendapat_401(): void
    {
        $room = Room::create([
            'name' => 'Ruang Uji',
            'code' => 'UJI-04',
            'capacity' => 10,
            'status' => 'ACTIVE',
        ]);

        $this->putJson("/api/rooms/{$room->id}", ['name' => 'Diubah'])
            ->assertUnauthorized();
    }
}
