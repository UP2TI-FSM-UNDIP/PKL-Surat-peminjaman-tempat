<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** Tambah aksi SKIPPED: tahap persetujuan dilewati karena approver-nya adalah pengaju. */
return new class extends Migration
{
    private const BASE = ['CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'RETURNED', 'UPDATED', 'EXPIRED', 'CANCELLED'];

    public function up(): void
    {
        $this->setActions([...self::BASE, 'SKIPPED']);
    }

    public function down(): void
    {
        DB::table('document_logs')->where('action', 'SKIPPED')->delete();
        $this->setActions(self::BASE);
    }

    private function setActions(array $values): void
    {
        if (DB::getDriverName() === 'pgsql') {
            $allowed = implode(', ', array_map(fn (string $v) => "'{$v}'", $values));
            DB::statement('ALTER TABLE "document_logs" DROP CONSTRAINT IF EXISTS "document_logs_action_check"');
            DB::statement("ALTER TABLE \"document_logs\" ADD CONSTRAINT \"document_logs_action_check\" CHECK (\"action\" IN ({$allowed}))");

            return;
        }

        Schema::table('document_logs', function (Blueprint $table) use ($values) {
            $table->enum('action', $values)->change();
        });
    }
};
