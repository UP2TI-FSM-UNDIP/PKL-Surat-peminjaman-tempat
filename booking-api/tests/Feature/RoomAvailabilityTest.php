<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\RoomBooking;
use Database\Seeders\BookingPolicySeeder;
use Database\Seeders\WorkflowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\CreatesReservationFixtures;
use Tests\TestCase;

class RoomAvailabilityTest extends TestCase
{
    use RefreshDatabase, CreatesReservationFixtures;

    private Document $document;

    private RoomBooking $booking;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([BookingPolicySeeder::class, WorkflowSeeder::class]);

        $this->document = $this->makeDraftReservation();
        $this->booking = $this->document->roomBookings()->firstOrFail();

        Sanctum::actingAs($this->document->creator);
    }

    public function test_empty_slot_is_available(): void
    {
        $this->postJson("/api/rooms/{$this->booking->room_id}/check-availability", [
            'date' => $this->booking->booking_date->toDateString(),
            'start_time' => '13:00',
            'end_time' => '15:00',
        ])->assertOk()->assertJsonPath('data.available', true);
    }

    public function test_overlapping_slot_is_unavailable(): void
    {
        $this->postJson("/api/rooms/{$this->booking->room_id}/check-availability", [
            'date' => $this->booking->booking_date->toDateString(),
            'start_time' => '10:00',
            'end_time' => '11:00',
        ])->assertOk()
            ->assertJsonPath('data.available', false)
            ->assertJsonCount(1, 'data.conflicts');
    }

    public function test_batch_availability_returns_per_slot_result(): void
    {
        $date = $this->booking->booking_date->toDateString();

        $this->postJson('/api/rooms/check-availability-batch', [
            'slots' => [
                [
                    'room_id' => $this->booking->room_id,
                    'booking_date' => $date,
                    'start_time' => '09:00',
                    'end_time' => '10:00',
                ],
                [
                    'room_id' => $this->booking->room_id,
                    'booking_date' => $date,
                    'start_time' => '13:00',
                    'end_time' => '14:00',
                ],
            ],
        ])->assertOk()
            ->assertJsonPath('data.available', false)
            ->assertJsonCount(2, 'data.slots')
            ->assertJsonPath('data.slots.0.available', false)
            ->assertJsonPath('data.slots.1.available', true);
    }

    public function test_room_schedule_lists_bookings(): void
    {
        $date = $this->booking->booking_date->toDateString();

        $this->getJson(
            "/api/rooms/{$this->booking->room_id}/schedule?start_date={$date}&end_date={$date}"
        )->assertOk()->assertJsonCount(1, 'data.bookings');
    }

    public function test_end_time_before_start_time_is_rejected(): void
    {
        $this->postJson("/api/rooms/{$this->booking->room_id}/check-availability", [
            'date' => $this->booking->booking_date->toDateString(),
            'start_time' => '15:00',
            'end_time' => '14:00',
        ])->assertStatus(422)->assertJsonValidationErrors('end_time');
    }
}
