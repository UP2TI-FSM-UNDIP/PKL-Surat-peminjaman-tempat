<?php

namespace Database\Seeders;

use App\Models\Room;
use Illuminate\Database\Seeder;

class E2eRoomSeeder extends Seeder
{
    public function run(): void
    {
        if (!app()->environment(['local', 'testing'])) {
            return;
        }

        Room::where('code', 'F104')->update(['adjacent_group' => 'E2E', 'adjacent_position' => 1]);
        Room::where('code', 'F107')->update(['adjacent_group' => 'E2E', 'adjacent_position' => 2]);
    }
}
