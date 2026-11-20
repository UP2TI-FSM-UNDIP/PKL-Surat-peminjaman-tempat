<?php

namespace Database\Seeders;

use App\Models\Room;
use Illuminate\Database\Seeder;

class SpecialRoomsSeeder extends Seeder
{
    /**
     * @var array<int, array{code:string,name:string,capacity:?int,type:string,max_end:string,description:?string}>
     */
    private const VENUES = [
        [
            'code' => 'F104',
            'name' => 'Ruang F104 - R. Rapat Departemen Matematika Lantai 1',
            'capacity' => 10,
            'type' => 'SIDANG',
            'max_end' => '16:30',
            'description' => null,
        ],
        [
            'code' => 'F107',
            'name' => 'Ruang F107 - R. Sidang Departemen Matematika',
            'capacity' => 30,
            'type' => 'SIDANG',
            'max_end' => '16:30',
            'description' => null,
        ],
        [
            'code' => 'F202',
            'name' => 'Ruang F202 - R. Rapat Departemen Matematika',
            'capacity' => 10,
            'type' => 'SIDANG',
            'max_end' => '16:30',
            'description' => null,
        ],
        [
            'code' => 'AU-01',
            'name' => 'Aula Utama FSM',
            'capacity' => 200,
            'type' => 'AULA',
            'max_end' => '16:30',
            'description' => 'Aula utama untuk acara besar fakultas - Gedung A Lantai 1',
        ],
        [
            'code' => 'RR-A01',
            'name' => 'Ruang Rapat A',
            'capacity' => 20,
            'type' => 'LAINNYA',
            'max_end' => '16:30',
            'description' => 'Ruang rapat untuk pertemuan - Gedung A Lantai 2',
        ],
        [
            'code' => 'RS-B01',
            'name' => 'Ruang Seminar B',
            'capacity' => 80,
            'type' => 'AULA',
            'max_end' => '16:30',
            'description' => 'Ruang seminar - Gedung B Lantai 1',
        ],
        [
            'code' => 'PENDOPO-FSM',
            'name' => 'Pendopo FSM',
            'capacity' => null,
            'type' => 'PENDOPO',
            'max_end' => '16:30',
            'description' => 'Venue fakultas; kapasitas dan foto menunggu data FSM.',
        ],
        [
            'code' => 'STUDIO-FSM',
            'name' => 'Studio FSM',
            'capacity' => null,
            'type' => 'STUDIO',
            'max_end' => '18:00',
            'description' => 'Venue fakultas; kapasitas dan foto menunggu data FSM.',
        ],
    ];

    public function run(): void
    {
        $created = 0;
        $skipped = 0;
        $canonicalCodes = ['F104', 'F107', 'F202'];

        foreach (self::VENUES as $venue) {
            $room = Room::withTrashed()->firstOrNew(['code' => $venue['code']]);

            if ($room->exists && $room->trashed()) {
                $this->command?->warn("Ruang {$venue['code']} ter-soft-delete; dilewati.");
                $skipped++;
                continue;
            }

            if ($room->exists && $room->weekday_seeded_at !== null) {
                $skipped++;
                continue;
            }

            $isNew = !$room->exists;

            if ($isNew && in_array($venue['code'], $canonicalCodes, true)) {
                $this->command?->warn(
                    "Ruang kanonis {$venue['code']} tidak ditemukan; dibuat dengan data minimal."
                );
            }

            if ($isNew) {
                $room->fill([
                    'name' => $venue['name'],
                    'capacity' => $venue['capacity'],
                    'type' => $venue['type'],
                    'is_bookable_weekday' => true,
                    'weekday_max_end_time' => $venue['max_end'],
                    'status' => 'ACTIVE',
                    'facilities' => [],
                    'description' => $venue['description'],
                ]);
            } else {
                if ($room->type === null) {
                    $room->type = $venue['type'];
                }
                if ($room->weekday_max_end_time === null) {
                    $room->weekday_max_end_time = $venue['max_end'];
                }
                $room->is_bookable_weekday = true;
            }

            $room->weekday_seeded_at = now();
            $room->save();

            $isNew ? $created++ : $skipped++;
        }

        $flagged = Room::where('is_bookable_weekday', true)
            ->orderBy('code')
            ->pluck('code')
            ->all();

        $this->command?->info(
            "SpecialRoomsSeeder: {$created} created, {$skipped} skipped."
        );
        $this->command?->info('Ruang weekday: ' . implode(', ', $flagged));

        $seedCodes = array_column(self::VENUES, 'code');
        $activeCodes = Room::withTrashed()
            ->whereIn('code', $seedCodes)
            ->whereNull('deleted_at')
            ->where('status', 'ACTIVE')
            ->pluck('code')
            ->all();
        $missing = array_diff($seedCodes, $activeCodes);
        if ($missing !== []) {
            $this->command?->warn(
                'Ruang seed tidak ditemukan atau tidak ACTIVE: ' . implode(', ', $missing)
            );
        }
    }
}
