<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthSessionTest extends TestCase
{
    use RefreshDatabase;

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

    public function test_logout_revokes_bearer_token(): void
    {
        $user = $this->userWithRole('peminjam');
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/logout')
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);

        // Sanctum memakai RequestGuard yang menyimpan user hasil resolve.
        // Tanpa ini, request berikutnya masih dianggap terautentikasi.
        $this->app['auth']->forgetGuards();

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/user')
            ->assertUnauthorized();
    }

    public function test_authenticated_user_can_read_own_profile(): void
    {
        $user = $this->userWithRole('peminjam');
        Sanctum::actingAs($user);

        $this->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('email', $user->email);
    }
}
