<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        if (!app()->environment(['local', 'testing'])) {
            $this->command?->warn('UserSeeder dilewati: hanya untuk local/testing.');

            return;
        }

        $unit = Unit::where('code', 'FSM')->firstOrFail();
        $roles = Role::pluck('id', 'slug');

        $users = [
            ['name' => 'Admin', 'email' => 'admin@fsm.undip.ac.id', 'role' => 'admin'],
            ['name' => 'Wakil Dekan II', 'email' => 'wadek2@fsm.undip.ac.id', 'role' => 'wadek2'],
            ['name' => 'Manajer Tata Usaha', 'email' => 'tu@fsm.undip.ac.id', 'role' => 'manajer-tata-usaha'],
            ['name' => 'Supervisor Sumberdaya', 'email' => 'spv@fsm.undip.ac.id', 'role' => 'spv-sumberdaya'],
            ['name' => 'Mahasiswa Demo (Putra)', 'email' => 'mahasiswa@student.undip.ac.id', 'role' => 'peminjam'],
            ['name' => 'Mahasiswa Demo (Putri)', 'email' => 'mahasiswi@student.undip.ac.id', 'role' => 'peminjam'],
            ['name' => 'Dosen Demo', 'email' => 'dosen@undip.ac.id', 'role' => 'dosen'],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(['email' => $user['email']], [
                'name' => $user['name'],
                'password' => Hash::make('password'),
                'role_id' => $roles[$user['role']],
                'unit_id' => $unit->id,
                'is_profile_completed' => true,
            ]);
        }
    }
}
