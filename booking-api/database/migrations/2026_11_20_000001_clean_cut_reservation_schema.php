<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('signs');
        Schema::dropIfExists('document_templates');

        Schema::create('booking_policies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedTinyInteger('min_booking_days')->default(1);
            $table->unsignedSmallInteger('max_dates_per_room')->default(10);
            $table->unsignedSmallInteger('max_rooms_per_date')->default(5);
            $table->unsignedSmallInteger('max_total_room_hours')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('booking_policy_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_policy_id')->constrained('booking_policies')->cascadeOnDelete();
            $table->unsignedSmallInteger('min_days_before');
            $table->unsignedSmallInteger('deadline_offset');
            $table->string('label')->nullable();
            $table->timestamps();
            $table->unique(['booking_policy_id', 'min_days_before']);
        });

        Schema::create('booking_policy_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_policy_id')->constrained('booking_policies')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->json('before_json')->nullable();
            $table->json('after_json')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->timestamp('proposal_completed_at')->nullable()->after('file_proposal');
            $table->date('reservation_deadline')->nullable()->after('proposal_completed_at')->index();
            $table->timestamp('expired_at')->nullable()->after('reservation_deadline');
            $table->timestamp('cancelled_at')->nullable()->after('expired_at');
            $table->foreignId('cancelled_by')->nullable()->after('cancelled_at')->constrained('users')->nullOnDelete();
            $table->foreignId('deadline_policy_id')->nullable()->after('cancelled_by')->constrained('booking_policies')->nullOnDelete();
            $table->json('deadline_rule_snapshot')->nullable()->after('deadline_policy_id');
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex(['nomor_surat']);
        });

        $this->changeEnum('documents', 'status', [
            'DRAFT', 'IN_PROGRESS', 'REVISION', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED',
        ], 'DRAFT');

        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['nomor_surat', 'file_executive_summary', 'file_approval_sheet']);
        });

        Schema::table('room_bookings', function (Blueprint $table) {
            $table->unsignedSmallInteger('slot_index')->nullable()->after('document_id');
            $table->boolean('is_sekat')->default(false)->after('slot_index');
            $table->timestamp('cancelled_at')->nullable()->after('rejection_reason');
            $table->foreignId('cancelled_by')->nullable()->after('cancelled_at')->constrained('users')->nullOnDelete();
        });

        Schema::table('document_logs', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });
        Schema::table('document_logs', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
        });
        $this->changeEnum('document_logs', 'action', [
            'CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'RETURNED', 'UPDATED', 'EXPIRED', 'CANCELLED',
        ]);
        Schema::table('document_logs', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')->nullable()->change();
        });
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('role_id')->references('id')->on('roles')->nullOnDelete();
        });

        DB::table('roles')->where('slug', 'menunggu-penetapan')->delete();
    }

    /**
     * Ubah nilai enum tanpa menghasilkan sintaks ALTER COLUMN yang tidak valid
     * di PostgreSQL. SQLite tetap memakai change() bawaan Laravel.
     *
     * @param  array<int, string>  $values
     */
    private function changeEnum(string $tableName, string $column, array $values, ?string $default = null): void
    {
        if (DB::getDriverName() === 'pgsql') {
            $constraint = "{$tableName}_{$column}_check";

            DB::statement("ALTER TABLE \"{$tableName}\" DROP CONSTRAINT IF EXISTS \"{$constraint}\"");
            DB::statement("ALTER TABLE \"{$tableName}\" ALTER COLUMN \"{$column}\" TYPE varchar(255)");

            if ($default === null) {
                DB::statement("ALTER TABLE \"{$tableName}\" ALTER COLUMN \"{$column}\" DROP DEFAULT");
            } else {
                DB::statement("ALTER TABLE \"{$tableName}\" ALTER COLUMN \"{$column}\" SET DEFAULT '{$default}'");
            }

            DB::statement("ALTER TABLE \"{$tableName}\" ALTER COLUMN \"{$column}\" SET NOT NULL");

            $allowed = implode(', ', array_map(fn (string $value) => "'{$value}'", $values));
            DB::statement("ALTER TABLE \"{$tableName}\" ADD CONSTRAINT \"{$constraint}\" CHECK (\"{$column}\" IN ({$allowed}))");

            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($column, $values, $default) {
            $definition = $table->enum($column, $values);

            if ($default !== null) {
                $definition->default($default);
            }

            $definition->change();
        });
    }

    public function down(): void
    {
        throw new \RuntimeException('Clean cut migration is irreversible; restore backup.');
    }
};
