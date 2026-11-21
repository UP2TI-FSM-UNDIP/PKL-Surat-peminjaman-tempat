<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * Login dev tanpa SSO. Hanya dipasang di route yang sudah melewati
 * EnsureDevLoginEnabled, sehingga semua asumsi keamanan ada di middleware itu.
 *
 * Endpoint ini tidak menerima role/email dari client dan tidak membuat user.
 * Client hanya memilih user_id yang sudah ada; tanpa user_id dipakai akun admin.
 */
class DevAuthController extends Controller
{
    /** Urutan role yang ditampilkan di menu dev. */
    private const ROLE_ORDER = [
        'admin',
        'wadek2',
        'manajer-tata-usaha',
        'spv-sumberdaya',
        'peminjam',
        'dosen',
    ];

    /** Akun seed yang diprioritaskan saat satu role punya beberapa user. */
    private const PREFERRED_EMAILS = [
        'admin@fsm.undip.ac.id',
        'wadek2@fsm.undip.ac.id',
        'tu@fsm.undip.ac.id',
        'spv@fsm.undip.ac.id',
        'mahasiswa@student.undip.ac.id',
        'dosen@undip.ac.id',
    ];

    public function session(): JsonResponse
    {
        $default = $this->defaultUser();

        return response()->json([
            'enabled' => true,
            'default_user_id' => $default?->id,
            'accounts' => $this->accounts(),
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
        ]);

        $user = isset($validated['user_id'])
            ? User::with(['role', 'unit'])->findOrFail($validated['user_id'])
            : $this->defaultUser();

        if (! $user) {
            return response()->json([
                'message' => 'Akun admin belum ada. Jalankan php artisan db:seed terlebih dahulu.',
            ], 409);
        }

        // Satu token dev aktif per user supaya token tidak menumpuk saat berpindah akun.
        $user->tokens()->where('name', 'dev-login')->delete();

        $token = $user->createToken('dev-login', ['*'], now()->addDays(7))->plainTextToken;

        Log::warning('[DEV] Login tanpa SSO', [
            'user_id' => $user->id,
            'email' => $user->email,
            'role' => $user->role?->slug,
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'message' => 'Dev login successful',
            'token' => $token,
            'user' => $user,
            'unit_category' => $user->unit?->category,
        ]);
    }

    /**
     * Satu akun per role, dengan akun seed sebagai prioritas.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function accounts(): Collection
    {
        $preferred = array_flip(self::PREFERRED_EMAILS);

        return User::query()
            ->with(['role:id,name,slug', 'unit:id,name,code,category'])
            ->whereNotNull('role_id')
            ->whereHas('role', fn ($query) => $query->whereIn('slug', self::ROLE_ORDER))
            ->get()
            ->sortBy(function (User $user) use ($preferred): string {
                $roleIndex = array_search($user->role?->slug, self::ROLE_ORDER, true);
                $roleIndex = $roleIndex === false ? 99 : $roleIndex;

                return sprintf(
                    '%03d-%d-%010d',
                    $roleIndex,
                    array_key_exists($user->email, $preferred) ? 0 : 1,
                    $user->id,
                );
            })
            ->unique('role_id')
            ->values()
            ->map(fn (User $user): array => [
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => [
                    'name' => $user->role?->name,
                    'slug' => $user->role?->slug,
                ],
                'unit' => [
                    'name' => $user->unit?->name,
                    'code' => $user->unit?->code,
                    'category' => $user->unit?->category,
                ],
            ]);
    }

    private function defaultUser(): ?User
    {
        $user = User::query()
            ->with(['role', 'unit'])
            ->where('email', 'admin@fsm.undip.ac.id')
            ->first();

        if ($user?->isAdmin()) {
            return $user;
        }

        return User::query()
            ->with(['role', 'unit'])
            ->whereHas('role', fn ($query) => $query->where('slug', 'admin'))
            ->orderBy('id')
            ->first();
    }
}
