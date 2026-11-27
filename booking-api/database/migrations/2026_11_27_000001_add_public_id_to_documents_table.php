<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * ID publik acak untuk dokumen, dipakai di URL dan API agar ID numerik
 * (yang mudah ditebak dan menunjukkan jumlah data) tidak terlihat pengguna.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->string('public_id', 26)->nullable()->after('id');
        });

        DB::table('documents')->whereNull('public_id')->orderBy('id')->each(function ($row) {
            DB::table('documents')->where('id', $row->id)->update(['public_id' => strtolower((string) Str::ulid())]);
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->unique('public_id');
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropUnique(['public_id']);
            $table->dropColumn('public_id');
        });
    }
};
