<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Room;
use App\Models\Unit;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\BookingPolicySeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\UnitSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookingRuleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-11-20 10:00:00', 'Asia/Jakarta'));
        $this->seed([RoleSeeder::class, UnitSeeder::class, BookingPolicySeeder::class]);
        Sanctum::actingAs($this->userWithRole('peminjam'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function userWithRole(string $slug): User
    {
        $role = Role::firstOrCreate(['slug' => $slug], ['name' => $slug]);
        $unit = Unit::firstOrCreate(['code' => 'FSM'], ['name' => 'FSM', 'category' => 'FAKULTAS']);

        return User::factory()->create([
            'role_id' => $role->id,
            'unit_id' => $unit->id,
            'is_profile_completed' => true,
        ]);
    }

    public function test_weekday_only_returns_flagged_active_rooms(): void
    {
        Room::create(['name' => 'F107', 'code' => 'F107', 'status' => 'ACTIVE', 'is_bookable_weekday' => true, 'weekday_max_end_time' => '16:30']);
        Room::create(['name' => 'Aula', 'code' => 'AU-01', 'status' => 'ACTIVE', 'is_bookable_weekday' => false]);
        Room::create(['name' => 'Studio', 'code' => 'STUDIO', 'status' => 'ACTIVE', 'is_bookable_weekday' => true, 'weekday_max_end_time' => '18:00']);

        $response = $this->getJson('/api/booking-rules?date=2026-11-23')->assertOk();

        $response->assertJsonPath('data.day_type', 'weekday')
            ->assertJsonPath('data.is_bookable', true)
            ->assertJsonCount(2, 'data.rooms')
            ->assertJsonFragment(['code' => 'F107', 'max_end_time' => '16:30'])
            ->assertJsonFragment(['code' => 'STUDIO', 'max_end_time' => '18:00']);
    }

    public function test_sunday_is_not_bookable(): void
    {
        $this->getJson('/api/booking-rules?date=2026-11-22')
            ->assertOk()
            ->assertJsonPath('data.is_bookable', false)
            ->assertJsonCount(0, 'data.rooms');
    }

    public function test_past_date_is_not_bookable_with_past_message(): void
    {
        $this->getJson('/api/booking-rules?date=2026-11-18')
            ->assertOk()
            ->assertJsonPath('data.day_type', 'past')
            ->assertJsonPath('data.is_bookable', false)
            ->assertJsonPath('data.message', 'Tanggal sudah lewat.')
            ->assertJsonCount(0, 'data.rooms');
    }

    public function test_today_is_too_soon_not_past(): void
    {
        $this->getJson('/api/booking-rules?date=2026-11-20')
            ->assertOk()
            ->assertJsonPath('data.day_type', 'too_soon')
            ->assertJsonPath('data.is_bookable', false)
            ->assertJsonPath('data.message', 'Tanggal terlalu dekat; minimal H-1.');
    }
}
