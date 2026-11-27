<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Room;
use App\Models\Unit;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\BookingPolicySeeder;
use Database\Seeders\WorkflowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReservationBorrowerRolesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-11-20 10:00:00', 'Asia/Jakarta'));
        $this->seed([BookingPolicySeeder::class, WorkflowSeeder::class]);
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

        return User::factory()->create(['role_id' => $role->id, 'unit_id' => $unit->id, 'is_profile_completed' => true]);
    }

    private function payload(Room $room, string $date): array
    {
        return [
            'mode' => 'one_room_many_dates',
            'slots' => [['room_id' => $room->id, 'booking_date' => $date, 'start_time' => '09:00', 'end_time' => '12:00']],
            'purpose' => 'Rapat',
            'ketua_pelaksana_nama' => 'Ketua',
            'ketua_pelaksana_identitas' => '24060121120001',
            'ketua_pelaksana_hp' => '081234567890',
            'intent' => 'reservation',
        ];
    }

    public function test_approver_roles_and_admin_can_create_reservation(): void
    {
        $room = Room::create(['name' => 'F107', 'code' => 'F107', 'status' => 'ACTIVE', 'is_bookable_weekday' => true, 'weekday_max_end_time' => '16:30']);
        $dates = ['spv-sumberdaya' => '2026-12-01', 'manajer-tata-usaha' => '2026-12-02', 'wadek2' => '2026-12-03', 'admin' => '2026-12-04'];

        foreach ($dates as $slug => $date) {
            Sanctum::actingAs($this->userWithRole($slug));
            $this->postJson('/api/reservations', $this->payload($room, $date))->assertCreated();
        }

        $this->assertDatabaseCount('room_bookings', 4);
    }

    public function test_admin_mine_filter_lists_only_own_documents(): void
    {
        $room = Room::create(['name' => 'F107', 'code' => 'F107', 'status' => 'ACTIVE', 'is_bookable_weekday' => true, 'weekday_max_end_time' => '16:30']);

        Sanctum::actingAs($this->userWithRole('peminjam'));
        $this->postJson('/api/reservations', $this->payload($room, '2026-12-01'))->assertCreated();

        $admin = $this->userWithRole('admin');
        Sanctum::actingAs($admin);
        $this->postJson('/api/reservations', $this->payload($room, '2026-12-02'))->assertCreated();

        $this->getJson('/api/documents')->assertOk()->assertJsonPath('data.my_documents.total', 2);
        $this->getJson('/api/documents?mine=1')
            ->assertOk()
            ->assertJsonPath('data.my_documents.total', 1)
            ->assertJsonPath('data.my_documents.data.0.creator_id', $admin->id);
    }
}
