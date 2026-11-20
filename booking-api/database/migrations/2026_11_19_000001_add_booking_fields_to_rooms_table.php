<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->string('type')->nullable()->after('code');
            $table->boolean('is_bookable_weekday')->default(false)->after('type');
            $table->time('weekday_max_end_time')->nullable()->after('is_bookable_weekday');
            $table->string('adjacent_group')->nullable()->after('weekday_max_end_time');
            $table->unsignedInteger('adjacent_position')->nullable()->after('adjacent_group');
            $table->timestamp('weekday_seeded_at')->nullable()->after('adjacent_position');
        });
    }

    public function down(): void
    {
        Schema::table('rooms', function (Blueprint $table) {
            $table->dropColumn([
                'type',
                'is_bookable_weekday',
                'weekday_max_end_time',
                'adjacent_group',
                'adjacent_position',
                'weekday_seeded_at',
            ]);
        });
    }
};
