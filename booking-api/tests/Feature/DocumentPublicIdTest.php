<?php

namespace Tests\Feature;

use App\Models\Document;
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

class DocumentPublicIdTest extends TestCase
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

    public function test_document_gets_random_public_id_usable_in_api(): void
    {
        $role = Role::create(['name' => 'Mahasiswa', 'slug' => 'peminjam']);
        $unit = Unit::create(['name' => 'FSM', 'code' => 'FSM', 'category' => 'FAKULTAS']);
        $user = User::factory()->create(['role_id' => $role->id, 'unit_id' => $unit->id, 'is_profile_completed' => true]);
        Sanctum::actingAs($user);
        $room = Room::create(['name' => 'F107', 'code' => 'F107', 'status' => 'ACTIVE', 'is_bookable_weekday' => true, 'weekday_max_end_time' => '16:30']);

        $publicId = $this->postJson('/api/reservations', [
            'mode' => 'one_room_many_dates',
            'slots' => [['room_id' => $room->id, 'booking_date' => '2026-12-01', 'start_time' => '09:00', 'end_time' => '12:00']],
            'purpose' => 'Rapat',
            'ketua_pelaksana_nama' => 'Ketua',
            'ketua_pelaksana_identitas' => '24060121120001',
            'ketua_pelaksana_hp' => '081234567890',
            'intent' => 'reservation',
        ])->assertCreated()->json('data.public_id');

        $this->assertMatchesRegularExpression('/^[0-9a-z]{26}$/', $publicId);
        $document = Document::where('public_id', $publicId)->firstOrFail();

        $this->getJson("/api/documents/{$publicId}")->assertOk()->assertJsonPath('data.id', $document->id);
        $this->getJson("/api/reservations/{$publicId}/summary")->assertOk();
        $this->getJson('/api/documents/zzzzzzzzzzzzzzzzzzzzzzzzzz')->assertStatus(404);
    }
}
