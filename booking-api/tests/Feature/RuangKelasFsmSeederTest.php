<?php

namespace Tests\Feature;

use App\Models\Room;
use Database\Seeders\RuangKelasFsmSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RuangKelasFsmSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_tidak_menimpa_data_admin(): void
    {
        $room = Room::create([
            'name' => 'Nama Kustom F107',
            'code' => 'F107',
            'capacity' => 35,
            'status' => 'ACTIVE',
            'description' => 'Deskripsi kustom',
        ]);

        $this->seed(RuangKelasFsmSeeder::class);

        $room->refresh();
        $this->assertSame('Nama Kustom F107', $room->name);
        $this->assertSame(35, $room->capacity);
        $this->assertSame('Deskripsi kustom', $room->description);
    }
}
