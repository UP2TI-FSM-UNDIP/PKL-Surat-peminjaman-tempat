<?php

namespace Tests\Feature;

use App\Providers\AppServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class UrlRootTest extends TestCase
{
    public function test_staging_boot_keeps_api_prefix_behind_proxy(): void
    {
        URL::useOrigin(null);
        config(['app.url' => 'https://apps-fsm.undip.ac.id/peminjaman-ruang-api-staging']);
        $this->app->instance('request', Request::create('https://apps-fsm.undip.ac.id/api/room-bookings/1/qrcode'));
        $this->app->detectEnvironment(fn () => 'staging');

        (new AppServiceProvider($this->app))->boot();

        $this->assertSame(
            'https://apps-fsm.undip.ac.id/peminjaman-ruang-api-staging/api/room-bookings/1/qrcode',
            url('/api/room-bookings/1/qrcode')
        );
    }
}
