<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Room;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\ProductionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductionSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_production_seeder_tidak_membuat_user_demo(): void
    {
        $this->seed(ProductionSeeder::class);

        $this->assertSame(0, User::count());
        $this->assertSame(6, Role::count());
        $this->assertGreaterThanOrEqual(8, Room::count());
    }

    public function test_database_seeder_lokal_tetap_membuat_user_demo(): void
    {
        $this->app['env'] = 'local';

        $this->seed(DatabaseSeeder::class);

        $this->assertSame(6, User::count());
        $this->assertDatabaseHas('users', ['email' => 'admin@fsm.undip.ac.id']);
    }

    public function test_database_seeder_staging_tidak_membuat_user_demo(): void
    {
        $this->app['env'] = 'staging';

        $this->seed(DatabaseSeeder::class);

        $this->assertSame(0, User::count());
    }
}
