<?php

namespace Tests\Feature;

use Database\Seeders\RoleSeeder;
use Database\Seeders\UnitSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SsoConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_redirect_memakai_frontend_url_dari_config(): void
    {
        config(['app.frontend_url' => 'https://apps-fsm.undip.ac.id/peminjaman-ruang-staging']);

        $this->get('/auth/sso/redirect?token=abc')
            ->assertRedirect('https://apps-fsm.undip.ac.id/peminjaman-ruang-staging/sso/callback?token=abc');
    }

    public function test_authenticate_memakai_sso_api_url_dari_config(): void
    {
        $this->seed([RoleSeeder::class, UnitSeeder::class]);
        config(['services.sso.api_url' => 'https://sso.test']);

        Http::fake([
            'https://sso.test/users/me' => Http::response([
                'data' => [
                    'username' => 'dosen@undip.ac.id',
                    'name' => 'Dosen Uji',
                    'role' => 'dosen',
                ],
            ]),
        ]);

        $this->withHeader('Authorization', 'Bearer token-uji')
            ->getJson('/auth/sso')
            ->assertOk();

        Http::assertSent(fn ($request) => $request->url() === 'https://sso.test/users/me');
    }
}
