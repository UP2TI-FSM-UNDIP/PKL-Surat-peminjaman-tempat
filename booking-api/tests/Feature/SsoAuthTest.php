<?php

namespace Tests\Feature;

use App\Models\Role;
use Database\Seeders\RoleSeeder;
use Database\Seeders\UnitSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SsoAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleSeeder::class, UnitSeeder::class]);
    }

    public function test_mahasiswa_maps_to_peminjam(): void
    {
        Http::fake([
            '*/users/me' => Http::response([
                'data' => ['username' => 'mhs@student.undip.ac.id', 'name' => 'Mahasiswa', 'role' => 'mahasiswa'],
            ]),
        ]);

        $this->withHeader('Authorization', 'token')->getJson('/auth/sso')->assertOk();

        $this->assertDatabaseHas('users', [
            'email' => 'mhs@student.undip.ac.id',
            'role_id' => Role::where('slug', 'peminjam')->value('id'),
        ]);
    }

    public function test_dosen_maps_to_dosen(): void
    {
        Http::fake([
            '*/users/me' => Http::response([
                'data' => ['username' => 'dosen@undip.ac.id', 'name' => 'Dosen', 'role' => 'dosen'],
            ]),
        ]);

        $this->withHeader('Authorization', 'token')->getJson('/auth/sso')->assertOk();

        $this->assertDatabaseHas('users', [
            'email' => 'dosen@undip.ac.id',
            'role_id' => Role::where('slug', 'dosen')->value('id'),
        ]);
    }

    public function test_staff_without_role_gets_null_role(): void
    {
        Http::fake([
            '*/users/me' => Http::response([
                'data' => ['username' => 'staff@undip.ac.id', 'name' => 'Staff', 'role' => 'staff'],
            ]),
        ]);

        $this->withHeader('Authorization', 'token')->getJson('/auth/sso')->assertOk();

        $this->assertDatabaseHas('users', ['email' => 'staff@undip.ac.id', 'role_id' => null]);
    }

    public function test_sso_admin_maps_to_admin(): void
    {
        Http::fake([
            '*/users/me' => Http::response([
                'data' => ['username' => 'admin@undip.ac.id', 'name' => 'Admin', 'role' => 'admin'],
            ]),
        ]);

        $this->withHeader('Authorization', 'token')->getJson('/auth/sso')->assertOk();

        $this->assertDatabaseHas('users', [
            'email' => 'admin@undip.ac.id',
            'role_id' => Role::where('slug', 'admin')->value('id'),
        ]);
    }
}
