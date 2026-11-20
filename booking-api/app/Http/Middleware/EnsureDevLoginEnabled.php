<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Penjaga jalur login dev (tanpa SSO).
 *
 * Jalur ini hanya boleh hidup di mesin pengembangan. Tiga lapis penjaga:
 * 1. AUTH_DEV_LOGIN harus dinyalakan eksplisit.
 * 2. APP_ENV harus local/development (production selalu 404).
 * 3. Request harus dari loopback, kecuali AUTH_DEV_LOGIN_ALLOW_REMOTE=true.
 *
 * Saat ditolak, respons sengaja 404 (bukan 403) agar endpoint tidak terlihat.
 */
class EnsureDevLoginEnabled
{
    private const LOOPBACK_IPS = ['127.0.0.1', '::1'];

    public function handle(Request $request, Closure $next): Response
    {
        if (!config('auth.dev_login')) {
            abort(404);
        }

        if (!app()->environment('local', 'development')) {
            abort(404);
        }

        if (!config('auth.dev_login_allow_remote')
            && !in_array($request->ip(), self::LOOPBACK_IPS, true)) {
            abort(404);
        }

        return $next($request);
    }
}
