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
use Tests\Feature\Concerns\CreatesReservationFixtures;
use Tests\TestCase;

class ReservationMultiSlotTest extends TestCase
{
    use RefreshDatabase, CreatesReservationFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-11-20 10:00:00', 'Asia/Jakarta'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function borrower(): User
    {
        $this->seed([BookingPolicySeeder::class, WorkflowSeeder::class]);
        $role = Role::create(['name' => 'Mahasiswa', 'slug' => 'peminjam']);
        $unit = Unit::create(['name' => 'FSM', 'code' => 'FSM', 'category' => 'FAKULTAS']);

        return User::factory()->create(['role_id' => $role->id, 'unit_id' => $unit->id, 'is_profile_completed' => true]);
    }

    public function test_one_room_many_dates_creates_pending_bookings_atomically(): void
    {
        Sanctum::actingAs($this->borrower());
        $room = Room::create(['name' => 'F107', 'code' => 'F107', 'status' => 'ACTIVE', 'is_bookable_weekday' => true, 'weekday_max_end_time' => '16:30']);

        $response = $this->postJson('/api/reservations', [
            'mode' => 'one_room_many_dates',
            'slots' => [
                ['room_id' => $room->id, 'booking_date' => '2026-12-01', 'start_time' => '09:00', 'end_time' => '12:00'],
                ['room_id' => $room->id, 'booking_date' => '2026-12-02', 'start_time' => '09:00', 'end_time' => '12:00'],
            ],
            'purpose' => 'Seminar',
            'ketua_pelaksana_nama' => 'Ketua',
            'ketua_pelaksana_identitas' => '24060121120001',
            'ketua_pelaksana_hp' => '081234567890',
            'intent' => 'reservation',
        ]);

        $response->assertCreated()->assertJsonCount(2, 'data.room_bookings');
        $this->assertDatabaseCount('room_bookings', 2);
        $this->assertDatabaseHas('documents', ['status' => 'DRAFT']);
    }

    public function test_conflict_rolls_back_all_slots(): void
    {
        Sanctum::actingAs($this->borrower());
        $room = Room::create(['name' => 'F107', 'code' => 'F107', 'status' => 'ACTIVE', 'is_bookable_weekday' => true, 'weekday_max_end_time' => '16:30']);
        $other = Room::create(['name' => 'F202', 'code' => 'F202', 'status' => 'ACTIVE', 'is_bookable_weekday' => true]);

        $this->postJson('/api/reservations', [
            'mode' => 'one_date_many_rooms',
            'slots' => [
                ['room_id' => $room->id, 'booking_date' => '2026-12-01', 'start_time' => '09:00', 'end_time' => '12:00'],
                ['room_id' => $other->id, 'booking_date' => '2026-12-01', 'start_time' => '09:00', 'end_time' => '12:00'],
            ],
            'purpose' => 'Seminar',
            'ketua_pelaksana_nama' => 'Ketua',
            'ketua_pelaksana_identitas' => '24060121120001',
            'ketua_pelaksana_hp' => '081234567890',
            'intent' => 'reservation',
        ])->assertCreated();

        $this->postJson('/api/reservations', [
            'mode' => 'one_room_many_dates',
            'slots' => [
                ['room_id' => $room->id, 'booking_date' => '2026-12-01', 'start_time' => '10:00', 'end_time' => '11:00'],
                ['room_id' => $room->id, 'booking_date' => '2026-12-02', 'start_time' => '10:00', 'end_time' => '11:00'],
            ],
            'purpose' => 'Bentrok',
            'ketua_pelaksana_nama' => 'Ketua',
            'ketua_pelaksana_identitas' => '24060121120001',
            'ketua_pelaksana_hp' => '081234567890',
            'intent' => 'reservation',
        ])->assertStatus(422);

        $this->assertDatabaseCount('room_bookings', 2);
    }

    public function test_buka_sekat_requires_adjacent_rooms(): void
    {
        Sanctum::actingAs($this->borrower());
        $a = Room::create(['name' => 'A101', 'code' => 'A101', 'status' => 'ACTIVE', 'is_bookable_weekday' => true, 'adjacent_group' => 'A1', 'adjacent_position' => 1]);
        $b = Room::create(['name' => 'A102', 'code' => 'A102', 'status' => 'ACTIVE', 'is_bookable_weekday' => true, 'adjacent_group' => 'A1', 'adjacent_position' => 2]);
        $c = Room::create(['name' => 'A103', 'code' => 'A103', 'status' => 'ACTIVE', 'is_bookable_weekday' => true, 'adjacent_group' => 'A1', 'adjacent_position' => 3]);

        $payload = [
            'mode' => 'one_date_many_rooms',
            'purpose' => 'Sekat',
            'ketua_pelaksana_nama' => 'Ketua',
            'ketua_pelaksana_identitas' => '24060121120001',
            'ketua_pelaksana_hp' => '081234567890',
            'intent' => 'reservation',
            'buka_sekat' => true,
        ];

        $this->postJson('/api/reservations', $payload + ['slots' => [
            ['room_id' => $a->id, 'booking_date' => '2026-12-01', 'start_time' => '09:00', 'end_time' => '12:00'],
            ['room_id' => $b->id, 'booking_date' => '2026-12-01', 'start_time' => '09:00', 'end_time' => '12:00'],
        ]])->assertCreated();

        $this->postJson('/api/reservations', $payload + ['slots' => [
            ['room_id' => $a->id, 'booking_date' => '2026-12-02', 'start_time' => '09:00', 'end_time' => '12:00'],
            ['room_id' => $c->id, 'booking_date' => '2026-12-02', 'start_time' => '09:00', 'end_time' => '12:00'],
        ]])->assertStatus(422);
    }

    private function sameDayPayload(int $roomId, string $intent, string $start = '11:00', string $end = '13:00'): array
    {
        return [
            'mode' => 'one_room_many_dates',
            'slots' => [['room_id' => $roomId, 'booking_date' => '2026-11-20', 'start_time' => $start, 'end_time' => $end]],
            'purpose' => 'Rapat mendadak',
            'ketua_pelaksana_nama' => 'Ketua',
            'ketua_pelaksana_identitas' => '24060121120001',
            'ketua_pelaksana_hp' => '081234567890',
            'intent' => $intent,
        ];
    }

    public function test_same_day_reservation_is_rejected(): void
    {
        Sanctum::actingAs($this->borrower());
        $room = Room::create(['name' => 'F107', 'code' => 'F107', 'status' => 'ACTIVE', 'is_bookable_weekday' => true, 'weekday_max_end_time' => '16:30']);

        $this->postJson('/api/reservations', $this->sameDayPayload($room->id, 'reservation'))
            ->assertUnprocessable()
            ->assertJsonFragment(['Tanggal hari ini hanya bisa lewat Ajukan Pinjam.']);
        $this->assertDatabaseCount('room_bookings', 0);
    }

    public function test_same_day_direct_borrowing_requires_lead_time(): void
    {
        Sanctum::actingAs($this->borrower());
        $room = Room::create(['name' => 'F107', 'code' => 'F107', 'status' => 'ACTIVE', 'is_bookable_weekday' => true, 'weekday_max_end_time' => '16:30']);

        $this->postJson('/api/reservations', $this->sameDayPayload($room->id, 'submit', '10:30', '12:00'))
            ->assertUnprocessable()
            ->assertJsonFragment(['Pinjam hari ini: jam mulai paling cepat 11:00.']);
    }

    public function test_same_day_direct_borrowing_creates_draft_due_today(): void
    {
        Sanctum::actingAs($this->borrower());
        $room = Room::create(['name' => 'F107', 'code' => 'F107', 'status' => 'ACTIVE', 'is_bookable_weekday' => true, 'weekday_max_end_time' => '16:30']);

        $this->postJson('/api/reservations', $this->sameDayPayload($room->id, 'submit'))
            ->assertCreated()
            ->assertJsonPath('data.status', 'DRAFT');

        $document = \App\Models\Document::first();
        $this->assertSame('2026-11-20', $document->reservation_deadline->toDateString());
        $this->assertSame('same_day', $document->deadline_rule_snapshot['strategy']);
    }
}
