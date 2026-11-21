<?php

namespace Tests\Feature;

use App\Models\Role;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_role_seeder_only_creates_six_roles(): void
    {
        $this->seed(RoleSeeder::class);

        $this->assertSame(6, Role::count());
        $this->assertDatabaseHas('roles', ['slug' => 'peminjam']);
        $this->assertDatabaseHas('roles', ['slug' => 'dosen']);
        $this->assertDatabaseMissing('roles', ['slug' => 'sekretaris']);
        $this->assertDatabaseMissing('roles', ['slug' => 'menunggu-penetapan']);
    }

    public function test_role_seeder_removes_existing_legacy_roles(): void
    {
        Role::create(['name' => 'Sekretaris', 'slug' => 'sekretaris']);
        Role::create(['name' => 'Ketua Ormawa', 'slug' => 'ketua-ormawa']);

        $this->seed(RoleSeeder::class);

        $this->assertSame(6, Role::count());
        $this->assertDatabaseMissing('roles', ['slug' => 'sekretaris']);
        $this->assertDatabaseMissing('roles', ['slug' => 'ketua-ormawa']);
    }
}
