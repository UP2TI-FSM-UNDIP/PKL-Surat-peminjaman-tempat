<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class RouteCacheTest extends TestCase
{
    public function test_tidak_ada_nama_route_duplikat(): void
    {
        $duplicates = collect(Route::getRoutes())
            ->map(fn ($route) => $route->getName())
            ->filter()
            ->duplicates()
            ->values();

        $this->assertCount(0, $duplicates, 'Nama route duplikat: '.$duplicates->implode(', '));
    }

    public function test_login_hanya_tersedia_di_api(): void
    {
        $this->postJson('/login')->assertNotFound();
        $this->postJson('/api/login', [
            'email' => 'tidak-ada@example.test',
            'password' => 'password',
        ])->assertStatus(403);
    }
}
