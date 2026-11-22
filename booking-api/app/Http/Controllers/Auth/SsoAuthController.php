<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Unit;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SsoAuthController extends Controller
{
    /**
     * Handle SSO callback from SSO Engine UNDIP.
     *
     * SSO Engine calls: GET /auth/sso
     * with header: Authorization: <sso_token>  (with or without "Bearer " prefix)
     *
     * This method:
     * 1. Extracts SSO token from Authorization header
     * 2. Validates the token against SSO API (/users/me)
     * 3. Finds or creates the local user based on email
     * 4. Creates a Sanctum token
     * 5. Returns { callback_url: "/redirect?token=..." }
     */
    public function authenticate(Request $request): JsonResponse
    {
        // Step 1: Extract SSO token from Authorization header
        // SSO may or may not include "Bearer " prefix — handle both cases
        $authHeader = $request->header('Authorization');
        $ssoToken = null;

        if ($authHeader) {
            if (str_starts_with($authHeader, 'Bearer ')) {
                $ssoToken = substr($authHeader, 7);
            } else {
                $ssoToken = $authHeader;
            }
        }

        if (!$ssoToken) {
            return response()->json(['message' => 'Token missing'], 400);
        }

        // Step 2: Validate token against SSO Engine
        // Always add "Bearer " prefix when calling SSO API
        $ssoApiUrl = config('services.sso.api_url');

        try {
            $ssoResponse = Http::withToken($ssoToken)
                ->timeout(10)
                ->get("{$ssoApiUrl}/users/me");

            if (!$ssoResponse->successful()) {
                Log::warning('[SSO] Token validation failed', [
                    'status' => $ssoResponse->status(),
                    'body' => $ssoResponse->body(),
                ]);
                return response()->json(['message' => 'Invalid SSO token'], 401);
            }

            $ssoData = $ssoResponse->json();
            Log::info('[SSO] Token validated', ['data' => $ssoData]);

        } catch (\Exception $e) {
            Log::error('[SSO] Failed to validate token against SSO API', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Invalid SSO token'], 401);
        }

        // Step 3: Extract user data from SSO response
        // IMPORTANT: email is in "username" field, NOT "email"
        // สำหรับ role superadmin, username อาจจะเป็น string 'superadmin' ไม่ใช่ email
        $ssoUser = $ssoData['data'] ?? null;
        $email = $ssoUser['username'] ?? null;  // "username" = identifier
        $name  = $ssoUser['name'] ?? null;
        $role  = $ssoUser['role'] ?? null;      // "mahasiswa", "dosen", "staff", "superadmin"

        if (!$email) {
            Log::error('[SSO] Username missing in SSO response', ['ssoUser' => $ssoUser]);
            return response()->json(['message' => 'Invalid SSO token payload'], 401);
        }

        // Relax email validation: If it's not a valid email, check if it's 'superadmin' 
        // or just allow it as a generic identifier from SSO.
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) && $email !== 'superadmin') {
            Log::warning('[SSO] Non-email username detected', ['username' => $email, 'role' => $role]);
        }

        // Step 4: Find existing user or auto-register
        //
        // Aturan role: admin/superadmin SSO menjadi Admin; mahasiswa menjadi
        // Peminjam; dosen menjadi Dosen; staf tanpa role dikenal mendapat
        // role_id null sampai admin menetapkannya.
        $isSsoAdmin = in_array($role, ['admin', 'superadmin'], true);
        $adminRoleId = Role::where('slug', 'admin')->value('id');

        $initialSlug = match (true) {
            $isSsoAdmin => 'admin',
            $role === 'mahasiswa' => 'peminjam',
            $role === 'dosen' => 'dosen',
            default => null,
        };
        $roleId = $initialSlug ? Role::where('slug', $initialSlug)->value('id') : null;

        $user = User::where('email', $email)->with(['role', 'unit'])->first();

        if (!$user) {
            // Auto-register: Create user with default role and unit
            // NOTE: unit_id remains NOT NULL; role_id may be null.
            Log::info('[SSO] User not found, auto-registering', ['email' => $email, 'name' => $name, 'sso_role' => $role]);

            $unitId = Unit::where('category', 'FAKULTAS')->value('id');

            $user = User::create([
                'name'        => $name ?? $email,
                'email'       => $email,
                'password'    => bcrypt(str()->random(32)), // Random unusable password
                'nim_nip'     => null,
                'role_id'     => $roleId,
                'unit_id'     => $unitId,
                'is_profile_completed' => false,
            ]);

            // Reload with relationships
            $user->load(['role', 'unit']);

            Log::info('[SSO] User auto-registered', [
                'user_id' => $user->id,
                'email'   => $email,
                'sso_role' => $role,
                'role'    => $user->role?->name ?? $roleId,
                'unit'    => $user->unit?->name ?? $unitId,
            ]);
        } else {
            Log::info('[SSO] Existing user found', ['user_id' => $user->id, 'email' => $email]);

            // Admin di SSO -> Admin di aplikasi (penurunan role hanya oleh admin)
            if ($isSsoAdmin && !$user->isAdmin() && $adminRoleId) {
                Log::warning('[SSO] Promoting user to Admin based on SSO role', [
                    'user_id' => $user->id, 'from_role' => $user->role?->slug, 'sso_role' => $role,
                ]);
                $user->update(['role_id' => $adminRoleId]);
                $user->load(['role', 'unit']);
            } elseif ($user->role_id === null && $roleId) {
                // Isi role bawaan SSO untuk user lama yang belum punya role.
                $user->update(['role_id' => $roleId]);
                $user->load(['role', 'unit']);
            }
        }

        // Step 5: Create a Sanctum token for the local session
        $token = $user->createToken('sso-auth-token')->plainTextToken;

        // Step 6: Return callback_url as relative path
        // SSO Engine will concat: application_url_callback + callback_url
        // Flow A: "http://apps-fsm.undip.ac.id/peminjaman-ruang-api/auth/sso" + "/redirect?token=..."
        //       = "http://apps-fsm.undip.ac.id/peminjaman-ruang-api/auth/sso/redirect?token=..."
        // Flow B: SSO uses frontend URL directly → frontend /redirect page handles it
        return response()->json([
            'callback_url' => '/redirect?token=' . $token,
        ]);
    }

    /**
     * Handle redirect from SSO backend (Flow A — App-Initiated).
     *
     * SSO calls our backend at: /auth/sso/redirect?token=...
     * We perform a 302 redirect to the frontend /sso/callback page.
     */
    public function redirect(Request $request)
    {
        $token = $request->query('token');

        if (!$token) {
            return response()->json(['message' => 'Token missing'], 400);
        }

        $frontendUrl = config('app.frontend_url');

        return redirect()->away("{$frontendUrl}/sso/callback?token={$token}");
    }
}
