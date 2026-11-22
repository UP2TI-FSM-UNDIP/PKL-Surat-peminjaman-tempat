<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            UnitSeeder::class,
            BookingPolicySeeder::class,
            WorkflowSeeder::class,
            RuangKelasFsmSeeder::class,
            SpecialRoomsSeeder::class,
        ]);
    }
}
