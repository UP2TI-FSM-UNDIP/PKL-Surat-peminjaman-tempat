<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Illuminate\Console\Command;

class AssignRole extends Command
{
    protected $signature = 'app:assign-role
        {--email= : Email user hasil login SSO}
        {--role=admin : Slug role yang akan diberikan}';

    protected $description = 'Tetapkan role user setelah login SSO (idempoten)';

    public function handle(): int
    {
        $email = $this->option('email');
        $roleSlug = $this->option('role');

        if (! $email) {
            $this->error('Opsi --email wajib diisi.');

            return self::FAILURE;
        }

        $role = Role::where('slug', $roleSlug)->first();

        if (! $role) {
            $this->error("Role '{$roleSlug}' tidak ditemukan.");

            return self::FAILURE;
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            $this->error("User '{$email}' belum ada. Login SSO sekali terlebih dahulu.");

            return self::FAILURE;
        }

        $user->update(['role_id' => $role->id]);
        $this->info("Role '{$role->slug}' diberikan kepada {$user->email}.");

        return self::SUCCESS;
    }
}
