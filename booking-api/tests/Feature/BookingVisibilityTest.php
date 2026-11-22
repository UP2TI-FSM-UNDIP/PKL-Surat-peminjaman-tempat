<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\RoomBooking;
use App\Models\User;
use Database\Seeders\BookingPolicySeeder;
use Database\Seeders\WorkflowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\CreatesReservationFixtures;
use Tests\TestCase;

class BookingVisibilityTest extends TestCase
{
    use RefreshDatabase, CreatesReservationFixtures;

    private Document $document;

    private RoomBooking $booking;

    private User $creator;

    private User $stranger;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([BookingPolicySeeder::class, WorkflowSeeder::class]);

        $this->document = $this->makeDraftReservation();
        $this->booking = $this->document->roomBookings()->firstOrFail();
        $this->creator = $this->document->creator;
        $this->stranger = $this->userWithRole('peminjam');
    }

    public function test_stranger_cannot_view_booking_detail(): void
    {
        Sanctum::actingAs($this->stranger);
        $this->getJson("/api/room-bookings/{$this->booking->id}")->assertForbidden();
    }

    public function test_stranger_cannot_view_receipt(): void
    {
        Sanctum::actingAs($this->stranger);
        $this->getJson("/api/room-bookings/{$this->booking->id}/receipt")->assertForbidden();
    }

    public function test_stranger_cannot_view_qrcode(): void
    {
        Sanctum::actingAs($this->stranger);
        $this->getJson("/api/room-bookings/{$this->booking->id}/qrcode")->assertForbidden();
    }

    public function test_pending_booking_has_no_qrcode(): void
    {
        Sanctum::actingAs($this->creator);
        $this->getJson("/api/room-bookings/{$this->booking->id}/qrcode")->assertStatus(400);
    }

    public function test_approved_booking_returns_qrcode(): void
    {
        $this->booking->update(['status' => 'APPROVED']);
        Sanctum::actingAs($this->creator);

        $response = $this->get("/api/room-bookings/{$this->booking->id}/qrcode");

        $response->assertOk();
        $this->assertStringStartsWith('image/', $response->headers->get('Content-Type'));
        $this->assertNotEmpty($response->getContent());
    }

    public function test_verification_token_is_accepted(): void
    {
        $token = $this->booking->verificationToken();

        $this->getJson("/api/room-bookings/{$this->booking->id}/verify?token={$token}")
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_invalid_verification_token_is_rejected(): void
    {
        $this->getJson("/api/room-bookings/{$this->booking->id}/verify?token=salah")
            ->assertNotFound();
    }
}
