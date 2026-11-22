<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class VerifyEnvironment extends Command
{
    protected $signature = 'app:verify-environment';

    protected $description = 'Pastikan environment staging tidak menunjuk produksi';

    public function handle(): int
    {
        $errors = [];

        if (config('app.env') !== 'staging') {
            $errors[] = 'APP_ENV harus staging.';
        }

        if (config('database.default') !== 'pgsql') {
            $errors[] = 'DB_CONNECTION harus pgsql, bukan '.config('database.default').'.';
        }

        if (config('database.connections.pgsql.database') !== 'peminjaman_ruang_staging') {
            $errors[] = 'DB_DATABASE harus peminjaman_ruang_staging, bukan '.config('database.connections.pgsql.database').'.';
        }

        $disk = config('filesystems.disks.private');
        $driver = $disk['driver'] ?? null;
        $bucket = $disk['bucket'] ?? null;

        if ($driver === 's3' && $bucket !== 'peminjaman-ruang-staging') {
            $errors[] = 'Bucket private staging harus peminjaman-ruang-staging, bukan '.($bucket ?? 'kosong').'.';
        }

        if ($driver !== 'local' && $driver !== 's3') {
            $errors[] = 'Driver private harus local atau s3.';
        }

        if (!str_contains((string) config('app.url'), '-staging')) {
            $errors[] = 'APP_URL harus mengandung -staging.';
        }

        if (config('auth.dev_login')) {
            $errors[] = 'AUTH_DEV_LOGIN harus false.';
        }

        if (config('auth.local_login') !== 'off') {
            $errors[] = 'AUTH_LOCAL_LOGIN harus off.';
        }

        if ($errors !== []) {
            foreach ($errors as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $this->info('Environment staging valid.');

        return self::SUCCESS;
    }
}
