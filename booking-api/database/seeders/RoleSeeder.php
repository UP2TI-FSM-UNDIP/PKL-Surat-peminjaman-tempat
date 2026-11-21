<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /** Role dari alur lama yang tidak boleh tersisa di database. */
    private const LEGACY_SLUGS = [
        'wadek1',
        'kemahasiswaan',
        'sumber-daya',
        'ketua-departemen',
        'dosen-pendamping',
        'ketua-ormawa',
        'senat',
        'sekretaris',
        'menunggu-penetapan',
    ];

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

        // User yang masih memakai role legacy menjadi tanpa role (pending),
        // sesuai kontrak clean cut: tidak ada role lama di database.
        Role::whereIn('slug', self::LEGACY_SLUGS)->delete();

        $this->command?->info('Role seeder: 6 role bisnis, role legacy dibersihkan.');
    }
}
