<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoomBookingWriteRemovedTest extends TestCase
{
    use RefreshDatabase;

    public function test_legacy_room_booking_write_routes_are_gone(): void
    {
        $role = Role::create(['name' => 'Peminjam', 'slug' => 'peminjam']);
        $unit = Unit::create(['name' => 'FSM', 'code' => 'FSM', 'category' => 'FAKULTAS']);
        $user = User::factory()->create(['role_id' => $role->id, 'unit_id' => $unit->id, 'is_profile_completed' => true]);
        Sanctum::actingAs($user);

        $this->postJson('/api/room-bookings', [])->assertStatus(405);
        $this->postJson('/api/room-bookings/batch', [])->assertStatus(405);
        $this->postJson('/api/room-bookings/1/approve', [])->assertNotFound();
        $this->postJson('/api/room-bookings/1/reject', [])->assertNotFound();
        $this->postJson('/api/room-bookings/1/cancel', [])->assertNotFound();
    }
}
