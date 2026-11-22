<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\ProductionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class AssignRoleCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ProductionSeeder::class);
    }

    public function test_admin_dapat_ditetapkan_dan_idempoten(): void
    {
        $user = User::factory()->create([
            'email' => 'calon-admin@example.test',
            'role_id' => null,
        ]);

        $this->assertSame(0, Artisan::call('app:assign-role', [
            '--email' => 'calon-admin@example.test',
            '--role' => 'admin',
        ]));

        $this->assertSame(
            Role::where('slug', 'admin')->value('id'),
            $user->fresh()->role_id,
        );

        $this->assertSame(0, Artisan::call('app:assign-role', [
            '--email' => 'calon-admin@example.test',
            '--role' => 'admin',
        ]));

        $this->assertSame(
            Role::where('slug', 'admin')->value('id'),
            $user->fresh()->role_id,
        );
    }

    public function test_user_yang_belum_login_ditolak(): void
    {
        $this->assertSame(1, Artisan::call('app:assign-role', [
            '--email' => 'belum-ada@example.test',
            '--role' => 'admin',
        ]));
    }

    public function test_role_tidak_dikenal_ditolak(): void
    {
        $user = User::factory()->create(['email' => 'user@example.test']);

        $this->assertSame(1, Artisan::call('app:assign-role', [
            '--email' => $user->email,
            '--role' => 'tidak-ada',
        ]));
    }
}
