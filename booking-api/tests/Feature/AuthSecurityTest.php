<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Unit;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Database\Seeders\UnitSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([RoleSeeder::class, UnitSeeder::class]);
    }

    private function role(string $slug): int
    {
        return Role::where('slug', $slug)->value('id');
    }

    private function unit(string $code = 'FSM'): int
    {
        return Unit::where('code', $code)->value('id');
    }

    private function makeUser(string $email, ?string $roleSlug = null, string $unitCode = 'FSM'): User
    {
        return User::factory()->create([
            'email' => $email,
            'password' => bcrypt('password'),
            'role_id' => $roleSlug ? $this->role($roleSlug) : null,
            'unit_id' => $this->unit($unitCode),
            'is_profile_completed' => true,
        ]);
    }

    /** @var array<string, mixed> */
    private array $ssoPayload = [];
    private bool $ssoFaked = false;

    private function fakeSso(string $username, string $ssoRole): void
    {
        $this->ssoPayload = ['username' => $username, 'name' => 'Pengguna SSO', 'role' => $ssoRole];

        if (!$this->ssoFaked) {
            Http::fake(['*/users/me' => fn () => Http::response(['data' => $this->ssoPayload])]);
            $this->ssoFaked = true;
        }
    }

    public function test_register_publik_ditutup(): void
    {
        $before = User::count();

        $this->postJson('/api/register', [
            'name' => 'Penyusup', 'email' => 'penyusup@example.test',
            'password' => 'Password123!', 'password_confirmation' => 'Password123!',
            'role_id' => $this->role('admin'), 'unit_id' => $this->unit(),
        ])->assertNotFound();

        $this->assertSame($before, User::count());
    }

    public function test_login_lokal_mati_secara_default(): void
    {
        config(['auth.local_login' => 'off']);
        $this->makeUser('admin@fsm.undip.ac.id', 'admin');

        $this->postJson('/api/login', ['email' => 'admin@fsm.undip.ac.id', 'password' => 'password'])
            ->assertForbidden()
            ->assertJsonPath('message', 'Login hanya melalui SSO FSM.');
    }

    public function test_mode_admin_hanya_menerima_akun_admin(): void
    {
        config(['auth.local_login' => 'admin']);
        $this->makeUser('admin@fsm.undip.ac.id', 'admin');
        $this->makeUser('mahasiswa@student.undip.ac.id', 'peminjam');

        $this->postJson('/api/login', ['email' => 'mahasiswa@student.undip.ac.id', 'password' => 'password'])
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', trans('auth.failed'));

        $this->postJson('/api/login', ['email' => 'admin@fsm.undip.ac.id', 'password' => 'password'])
            ->assertOk()
            ->assertJsonStructure(['token']);
    }

    public function test_update_profil_tidak_bisa_mengubah_role_atau_unit(): void
    {
        $user = $this->makeUser('mahasiswa@student.undip.ac.id', 'peminjam');
        $originalUnit = $user->unit_id;
        Sanctum::actingAs($user);

        $this->patchJson('/api/user/profile', [
            'name' => 'Nama Baru',
            'nim_nip' => '24060199990001',
            'role_id' => $this->role('admin'),
            'unit_id' => $this->unit('HMIF'),
        ])->assertOk();

        $user->refresh();
        $this->assertSame('peminjam', $user->role?->slug, 'role_id dari client harus diabaikan');
        $this->assertSame($originalUnit, $user->unit_id, 'unit_id dari client harus diabaikan');
        $this->assertSame('Nama Baru', $user->name);
        $this->assertTrue((bool) $user->is_profile_completed);
    }

    public function test_sso_mapping_uses_six_role_model(): void
    {
        $cases = [
            'mahasiswa' => 'peminjam',
            'dosen' => 'dosen',
            'staff' => null,
            'superadmin' => 'admin',
            'admin' => 'admin',
        ];

        foreach ($cases as $ssoRole => $expected) {
            $email = "sso-{$ssoRole}@undip.ac.id";
            $this->fakeSso($email, $ssoRole);

            $this->withHeaders(['Authorization' => 'jwt-palsu'])->getJson('/auth/sso')->assertOk();

            $user = User::where('email', $email)->firstOrFail();
            $this->assertSame($expected, $user->role?->slug, "SSO role {$ssoRole}");
            $this->assertSame('FAKULTAS', $user->unit->category);
            $this->assertFalse((bool) $user->is_profile_completed);
        }
    }

    public function test_akun_tanpa_role_tidak_punya_akses_fitur(): void
    {
        $user = $this->makeUser('pending@student.undip.ac.id', null);
        Sanctum::actingAs($user);

        $this->getJson('/api/user')->assertOk();
        $this->getJson('/api/units')->assertOk();
        $this->patchJson('/api/user/profile', [
            'name' => 'Akun Baru SSO',
            'nim_nip' => '24060199990003',
        ])->assertOk();
        $this->assertNull($user->fresh()->role_id, 'Melengkapi profil tidak mengubah role');

        foreach (['/api/documents', '/api/rooms', '/api/room-bookings', '/api/workflows', '/api/users', '/api/booking-rules'] as $url) {
            $this->getJson($url)->assertForbidden()->assertJsonPath('message', 'Akun Anda menunggu penetapan role oleh admin.');
        }

        $user->forceFill(['role_id' => $this->role('peminjam')])->save();
        Sanctum::actingAs($user->fresh());
        $this->getJson('/api/rooms')->assertOk();
    }

    public function test_sso_admin_menaikkan_akun_lama_tapi_tidak_menurunkan(): void
    {
        $user = $this->makeUser('mahasiswa@student.undip.ac.id', 'peminjam');

        Http::fake([
            '*/users/me' => Http::response([
                'data' => ['username' => $user->email, 'name' => $user->name, 'role' => 'superadmin'],
            ]),
        ]);
        $this->withHeaders(['Authorization' => 'jwt-palsu'])->getJson('/auth/sso')->assertOk();
        $this->assertSame('admin', $user->fresh()->role?->slug);

        Http::fake([
            '*/users/me' => Http::response([
                'data' => ['username' => $user->email, 'name' => $user->name, 'role' => 'mahasiswa'],
            ]),
        ]);
        $this->withHeaders(['Authorization' => 'jwt-palsu'])->getJson('/auth/sso')->assertOk();
        $this->assertSame('admin', $user->fresh()->role?->slug);
    }

    public function test_redirect_sso_tetap_ke_callback_frontend(): void
    {
        $this->get('/auth/sso/redirect?token=abc')
            ->assertRedirect()
            ->assertRedirectContains('/sso/callback?token=abc');
    }
}
