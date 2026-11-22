<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class VerifyEnvironmentCommandTest extends TestCase
{
    private function validConfig(): array
    {
        return [
            'app.env' => 'staging',
            'app.url' => 'https://apps-fsm.undip.ac.id/peminjaman-ruang-api-staging',
            'database.default' => 'pgsql',
            'database.connections.pgsql.database' => 'peminjaman_ruang_staging',
            'filesystems.disks.private.driver' => 'local',
            'filesystems.disks.private.bucket' => null,
            'auth.dev_login' => false,
            'auth.local_login' => 'off',
        ];
    }

    public function test_environment_staging_valid(): void
    {
        config($this->validConfig());

        $this->assertSame(0, Artisan::call('app:verify-environment'));
    }

    public function test_database_produksi_ditolak(): void
    {
        config($this->validConfig());
        config(['database.connections.pgsql.database' => 'database-tim-8']);

        $this->assertSame(1, Artisan::call('app:verify-environment'));
        $this->assertStringContainsString('database-tim-8', Artisan::output());
    }

    public function test_storage_s3_tanpa_bucket_staging_ditolak(): void
    {
        config($this->validConfig());
        config([
            'filesystems.disks.private.driver' => 's3',
            'filesystems.disks.private.bucket' => 'pkl',
        ]);

        $this->assertSame(1, Artisan::call('app:verify-environment'));
        $this->assertStringContainsString('pkl', Artisan::output());
    }

    public function test_dev_login_aktif_ditolak(): void
    {
        config($this->validConfig());
        config(['auth.dev_login' => true]);

        $this->assertSame(1, Artisan::call('app:verify-environment'));
    }

    public function test_koneksi_selain_pgsql_ditolak(): void
    {
        config($this->validConfig());
        config(['database.default' => 'sqlite']);

        $this->assertSame(1, Artisan::call('app:verify-environment'));
        $this->assertStringContainsString('sqlite', Artisan::output());
    }
}
