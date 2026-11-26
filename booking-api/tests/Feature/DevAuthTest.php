<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\UnitSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DevAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([RoleSeeder::class, UnitSeeder::class, UserSeeder::class]);

        $this->app['env'] = 'local';
        config([
            'auth.dev_login' => true,
            'auth.dev_login_allow_remote' => false,
        ]);
    }

    public function test_flag_mati_selalu_404(): void
    {
        config(['auth.dev_login' => false]);

        $this->getJson('/api/dev/session')->assertNotFound();
        $this->postJson('/api/dev/login')->assertNotFound();
    }

    public function test_production_tetap_404_meskipun_flag_nyala(): void
    {
        $this->app['env'] = 'production';

        $this->getJson('/api/dev/session')->assertNotFound();
        $this->postJson('/api/dev/login')->assertNotFound();
    }

    public function test_request_dari_luar_loopback_ditolak(): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => '10.10.10.10'])
            ->getJson('/api/dev/session')
            ->assertNotFound();
    }

    public function test_request_luar_loopback_boleh_bila_diizinkan(): void
    {
        config(['auth.dev_login_allow_remote' => true]);

        $this->withServerVariables(['REMOTE_ADDR' => '10.10.10.10'])
            ->getJson('/api/dev/session')
            ->assertOk();
    }

    public function test_session_menampilkan_semua_akun_demo(): void
    {
        $response = $this->getJson('/api/dev/session')->assertOk();

        $response->assertJsonPath('enabled', true);
        $response->assertJsonCount(7, 'accounts');
        $response->assertJsonPath('accounts.0.role.slug', 'admin');
        $response->assertJsonPath('accounts.1.role.slug', 'wadek2');
        $this->assertSame(
            ['mahasiswa@student.undip.ac.id', 'mahasiswi@student.undip.ac.id'],
            collect($response->json('accounts'))->where('role.slug', 'peminjam')->pluck('email')->values()->all(),
        );

        $this->assertSame(
            User::where('email', 'admin@fsm.undip.ac.id')->value('id'),
            $response->json('default_user_id'),
        );
    }

    public function test_session_tidak_menampilkan_role_legacy(): void
    {
        $legacyRole = Role::create([
            'name' => 'Sekretaris',
            'slug' => 'sekretaris',
        ]);

        User::factory()->create([
            'role_id' => $legacyRole->id,
            'is_profile_completed' => true,
        ]);

        $response = $this->getJson('/api/dev/session')->assertOk();

        $response->assertJsonCount(7, 'accounts');
        $this->assertNotContains(
            'sekretaris',
            collect($response->json('accounts'))->pluck('role.slug'),
        );
    }

    public function test_login_tanpa_user_id_memakai_admin_default(): void
    {
        $response = $this->postJson('/api/dev/login')->assertOk();

        $this->withHeader('Authorization', 'Bearer '.$response->json('token'))
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('role.slug', 'admin');
    }

    public function test_login_bisa_memilih_user_lain(): void
    {
        $wadek = User::where('email', 'wadek2@fsm.undip.ac.id')->firstOrFail();

        $response = $this->postJson('/api/dev/login', ['user_id' => $wadek->id])
            ->assertOk()
            ->assertJsonPath('user.role.slug', 'wadek2');

        $this->withHeader('Authorization', 'Bearer '.$response->json('token'))
            ->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('role.slug', 'wadek2');
    }

    public function test_user_id_tidak_dikenal_ditolak(): void
    {
        $this->postJson('/api/dev/login', ['user_id' => 999999])
            ->assertStatus(422)
            ->assertJsonValidationErrors('user_id');
    }

    public function test_tanpa_akun_admin_mengembalikan_409(): void
    {
        User::whereHas('role', fn ($query) => $query->where('slug', 'admin'))->delete();

        $this->postJson('/api/dev/login')->assertStatus(409);
    }

    public function test_token_dev_lama_dicabut_saat_login_ulang(): void
    {
        $firstToken = $this->postJson('/api/dev/login')->json('token');

        $this->postJson('/api/dev/login')->assertOk();

        $this->withHeader('Authorization', 'Bearer '.$firstToken)
            ->getJson('/api/user')
            ->assertUnauthorized();
    }

    public function test_user_non_demo_tidak_muncul_bila_role_sudah_punya_akun_demo(): void
    {
        User::factory()->create([
            'email' => 'sso.user@students.undip.ac.id',
            'role_id' => Role::where('slug', 'peminjam')->value('id'),
            'is_profile_completed' => true,
        ]);

        $emails = collect($this->getJson('/api/dev/session')->assertOk()->json('accounts'))->pluck('email');

        $this->assertNotContains('sso.user@students.undip.ac.id', $emails);
    }
}
