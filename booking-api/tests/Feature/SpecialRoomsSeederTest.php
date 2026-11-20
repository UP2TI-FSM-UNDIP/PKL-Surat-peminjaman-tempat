<?php

namespace Tests\Feature;

use App\Models\Room;
use Database\Seeders\SpecialRoomsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SpecialRoomsSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_mengisi_ruang_weekday_dan_idempoten(): void
    {
        $f107 = Room::create([
            'name' => 'Nama Kustom F107',
            'code' => 'F107',
            'capacity' => 40,
            'status' => 'ACTIVE',
            'description' => 'Deskripsi kustom',
            'facilities' => [],
        ]);

        Room::create([
            'name' => 'Lab Komputer 1',
            'code' => 'LK-01',
            'capacity' => 40,
            'status' => 'ACTIVE',
        ]);

        $g201 = Room::create([
            'name' => 'Ruang G201',
            'code' => 'G201',
            'capacity' => 30,
            'status' => 'ACTIVE',
            'is_bookable_weekday' => true,
        ]);

        $this->seed(SpecialRoomsSeeder::class);

        $this->assertSame(1, Room::where('code', 'F107')->count());

        $f107->refresh();
        $this->assertSame('Nama Kustom F107', $f107->name);
        $this->assertSame(40, $f107->capacity);
        $this->assertSame('Deskripsi kustom', $f107->description);
        $this->assertSame('SIDANG', $f107->type);
        $this->assertTrue($f107->is_bookable_weekday);
        $this->assertSame('16:30', $f107->weekday_max_end_time);
        $this->assertNotNull($f107->weekday_seeded_at);

        $studio = Room::where('code', 'STUDIO-FSM')->firstOrFail();
        $this->assertSame('18:00', $studio->weekday_max_end_time);
        $this->assertTrue($studio->is_bookable_weekday);

        $pendopo = Room::where('code', 'PENDOPO-FSM')->firstOrFail();
        $this->assertSame('16:30', $pendopo->weekday_max_end_time);

        $this->assertTrue($g201->fresh()->is_bookable_weekday);
        $this->assertFalse(Room::where('code', 'LK-01')->firstOrFail()->is_bookable_weekday);
        $this->assertSame(9, Room::where('is_bookable_weekday', true)->count());

        $seededAt = $f107->weekday_seeded_at;
        $f107->update(['capacity' => 35, 'status' => 'MAINTENANCE']);
        $f104 = Room::where('code', 'F104')->firstOrFail();
        $f104->update(['is_bookable_weekday' => false]);

        $this->seed(SpecialRoomsSeeder::class);

        $f107->refresh();
        $this->assertSame(35, $f107->capacity);
        $this->assertSame('MAINTENANCE', $f107->status);
        $this->assertTrue($f107->is_bookable_weekday);
        $this->assertTrue($f107->weekday_seeded_at->equalTo($seededAt));
        $this->assertFalse($f104->fresh()->is_bookable_weekday);
        $this->assertSame(8, Room::where('is_bookable_weekday', true)->count());

        $f107->update([
            'type' => null,
            'weekday_max_end_time' => null,
            'is_bookable_weekday' => false,
        ]);

        $this->seed(SpecialRoomsSeeder::class);

        $f107->refresh();
        $this->assertNull($f107->type);
        $this->assertNull($f107->weekday_max_end_time);
        $this->assertFalse($f107->is_bookable_weekday);
    }

    public function test_seeder_membuat_f107_jika_belum_ada(): void
    {
        $this->seed(SpecialRoomsSeeder::class);

        $f107 = Room::where('code', 'F107')->firstOrFail();
        $this->assertSame('Ruang F107 - R. Sidang Departemen Matematika', $f107->name);
        $this->assertSame(30, $f107->capacity);
        $this->assertTrue($f107->is_bookable_weekday);
        $this->assertNotNull($f107->weekday_seeded_at);
    }

    public function test_seeder_melewati_ruang_ter_soft_delete(): void
    {
        $deleted = Room::create([
            'name' => 'Pendopo Lama',
            'code' => 'PENDOPO-FSM',
            'capacity' => null,
            'status' => 'ACTIVE',
        ]);
        $deleted->delete();

        $this->seed(SpecialRoomsSeeder::class);

        $this->assertSame(1, Room::withTrashed()->where('code', 'PENDOPO-FSM')->count());
        $this->assertTrue(Room::withTrashed()->where('code', 'PENDOPO-FSM')->firstOrFail()->trashed());
    }
}
