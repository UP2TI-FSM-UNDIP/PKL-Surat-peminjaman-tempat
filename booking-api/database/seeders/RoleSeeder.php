<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'Admin', 'slug' => 'admin'],
            ['name' => 'Wakil Dekan 2', 'slug' => 'wadek2'],
            ['name' => 'Manajer Tata Usaha', 'slug' => 'manajer-tata-usaha'],
            ['name' => 'Supervisor Sumberdaya', 'slug' => 'spv-sumberdaya'],
            ['name' => 'Mahasiswa', 'slug' => 'peminjam'],
            ['name' => 'Dosen', 'slug' => 'dosen'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(['slug' => $role['slug']], $role);
        }

        $this->command?->info('Role seeder: 6 role bisnis.');
    }
}
