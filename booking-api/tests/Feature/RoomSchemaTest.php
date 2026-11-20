<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class RoomSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_rooms_memiliki_kolom_weekday(): void
    {
        $columns = [
            'type',
            'is_bookable_weekday',
            'weekday_max_end_time',
            'adjacent_group',
            'adjacent_position',
            'weekday_seeded_at',
        ];

        foreach ($columns as $column) {
            $this->assertTrue(
                Schema::hasColumn('rooms', $column),
                "Kolom rooms.{$column} tidak ada"
            );
        }
    }
}
