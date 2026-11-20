<?php

namespace Database\Seeders;

use App\Models\BookingPolicy;
use Illuminate\Database\Seeder;

class BookingPolicySeeder extends Seeder
{
    public function run(): void
    {
        if (BookingPolicy::where('is_active', true)->exists()) {
            return;
        }

        $policy = BookingPolicy::create([
            'name' => 'Kebijakan Peminjaman FSM',
            'min_booking_days' => 1,
            'max_dates_per_room' => 10,
            'max_rooms_per_date' => 5,
            'max_total_room_hours' => null,
            'is_active' => true,
        ]);

        $policy->tiers()->createMany([
            ['min_days_before' => 15, 'deadline_offset' => 14, 'label' => 'H-15 atau lebih'],
            ['min_days_before' => 10, 'deadline_offset' => 9, 'label' => 'H-14 s.d. H-10'],
            ['min_days_before' => 6, 'deadline_offset' => 5, 'label' => 'H-9 s.d. H-6'],
            ['min_days_before' => 1, 'deadline_offset' => 1, 'label' => 'H-5 s.d. H-1'],
        ]);
    }
}
