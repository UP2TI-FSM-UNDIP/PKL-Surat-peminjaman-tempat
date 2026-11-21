<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class E2eUserSeeder extends Seeder
{
    public function run(): void
    {
        if (!app()->environment(['local', 'testing'])) {
            return;
        }

        $unitId = Unit::where('code', 'FSM')->value('id');
        $peminjamRoleId = Role::where('slug', 'peminjam')->value('id');

        User::updateOrCreate(
            ['email' => 'norole@example.test'],
            [
                'name' => 'E2E Tanpa Role',
                'password' => Hash::make('password'),
                'role_id' => null,
                'unit_id' => $unitId,
                'is_profile_completed' => true,
                'email_verified_at' => now(),
            ],
        );

        User::updateOrCreate(
            ['email' => 'profile@example.test'],
            [
                'name' => 'E2E Profil Belum Lengkap',
                'password' => Hash::make('password'),
                'role_id' => $peminjamRoleId,
                'unit_id' => $unitId,
                'is_profile_completed' => false,
                'email_verified_at' => now(),
            ],
        );
    }
}
