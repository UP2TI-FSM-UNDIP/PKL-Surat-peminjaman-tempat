<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\Room;
use App\Models\User;
use Carbon\Carbon;
use Database\Seeders\BookingPolicySeeder;
use Database\Seeders\WorkflowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Feature\Concerns\CreatesReservationFixtures;
use Tests\TestCase;

class CalendarApiTest extends TestCase
{
    use RefreshDatabase, CreatesReservationFixtures;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([BookingPolicySeeder::class, WorkflowSeeder::class]);
        Carbon::setTestNow(Carbon::parse('2026-11-20 10:00:00', 'Asia/Jakarta'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function room(): Room
    {
        return Room::firstOrCreate(['code' => 'F107'], [
            'name' => 'F107',
            'status' => 'ACTIVE',
            'is_bookable_weekday' => true,
            'weekday_max_end_time' => '16:30',
        ]);
    }

    private function reservationOn(string $date): Document
    {
        return $this->makeDraftReservation([
            'mode' => 'one_room_many_dates',
            'slots' => [[
                'room_id' => $this->room()->id,
                'booking_date' => $date,
                'start_time' => '09:00',
                'end_time' => '12:00',
            ]],
        ]);
    }

    public function test_calendar_contract_and_range_filter(): void
    {
        $inside = $this->reservationOn('2026-12-01');
        $outside = $this->reservationOn('2027-02-01');

        Sanctum::actingAs($inside->creator);

        $response = $this->getJson('/api/calendar?from=2026-12-01&to=2026-12-31');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.events')
            ->assertJsonPath('data.events.0.document_id', $inside->id)
            ->assertJsonPath('data.events.0.room.code', 'F107')
            ->assertJsonPath('data.events.0.start_time', '09:00')
            ->assertJsonPath('data.events.0.end_time', '12:00')
            ->assertJsonPath('data.events.0.display_status', 'reservation');

        $this->assertSame($inside->id, $response->json('data.events.0.document_id'));
        $this->assertNotSame($outside->id, $response->json('data.events.0.document_id'));
        $this->assertMatchesRegularExpression('/^\d{2}:\d{2}$/', $response->json('data.events.0.start_time'));

        $raw = json_decode($response->getContent());
        $this->assertInstanceOf(\stdClass::class, $raw->data->documents);

        $documents = $response->json('data.documents');
        $this->assertArrayHasKey($inside->id, $documents);
        $this->assertArrayNotHasKey('ketua_pelaksana_identitas', $documents[$inside->id]);
        $this->assertArrayNotHasKey('ketua_pelaksana_hp', $documents[$inside->id]);
    }

    public function test_calendar_returns_each_slot_as_event_and_document_once(): void
    {
        $document = $this->makeDraftReservation([
            'mode' => 'one_room_many_dates',
            'slots' => [
                ['room_id' => $this->room()->id, 'booking_date' => '2026-12-01', 'start_time' => '09:00', 'end_time' => '12:00'],
                ['room_id' => $this->room()->id, 'booking_date' => '2026-12-02', 'start_time' => '13:00', 'end_time' => '15:00'],
            ],
        ]);

        Sanctum::actingAs($document->creator);

        $response = $this->getJson('/api/calendar?from=2026-12-01&to=2026-12-31');

        $response->assertOk()->assertJsonCount(2, 'data.events');
        $this->assertSame(
            [$document->id, $document->id],
            collect($response->json('data.events'))->pluck('document_id')->all(),
        );
        $this->assertCount(1, $response->json('data.documents'));
        $this->assertCount(2, $response->json('data.documents')[$document->id]['slots']);
    }

    public function test_calendar_derives_display_status_and_reason(): void
    {
        $draft = $this->reservationOn('2026-12-01');
        $draft->update(['proposal_completed_at' => now()]);

        $revision = $this->reservationOn('2026-12-02');
        $revision->update(['status' => 'REVISION', 'proposal_completed_at' => now()]);

        $inProgress = $this->reservationOn('2026-12-03');
        $inProgress->update(['status' => 'IN_PROGRESS', 'proposal_completed_at' => now()]);

        $approved = $this->reservationOn('2026-12-04');
        $approved->update(['status' => 'APPROVED']);
        $approved->roomBookings()->update(['status' => 'APPROVED']);

        $cancelled = $this->reservationOn('2026-12-07');
        $cancelled->update(['status' => 'CANCELLED', 'cancelled_at' => now(), 'cancelled_by' => $cancelled->creator_id]);
        $cancelled->roomBookings()->update(['status' => 'CANCELLED', 'rejection_reason' => 'Batal oleh peminjam']);

        $expired = $this->reservationOn('2026-12-08');
        $expired->update(['status' => 'EXPIRED', 'expired_at' => now()]);
        $expired->roomBookings()->update(['status' => 'CANCELLED', 'rejection_reason' => 'Kedaluwarsa']);

        $rejected = $this->reservationOn('2026-12-09');
        $rejected->update(['status' => 'REJECTED', 'completed_at' => now()]);
        $rejected->roomBookings()->update(['status' => 'REJECTED', 'rejection_reason' => 'Proposal kurang lengkap']);

        $completed = $this->reservationOn('2026-12-10');
        $completed->update(['status' => 'APPROVED']);
        $completed->roomBookings()->update(['status' => 'COMPLETED']);

        Sanctum::actingAs($draft->creator);

        $response = $this->getJson('/api/calendar?from=2026-12-01&to=2026-12-10');
        $response->assertOk();

        $events = collect($response->json('data.events'))->keyBy('document_id');

        $this->assertSame('reservation', $events[$draft->id]['display_status']);
        $this->assertSame('Reservasi', $events[$draft->id]['status_label']);
        $this->assertSame('reservation', $events[$revision->id]['display_status']);
        $this->assertSame('active', $events[$inProgress->id]['display_status']);
        $this->assertSame('Aktif', $events[$inProgress->id]['status_label']);
        $this->assertSame('active', $events[$approved->id]['display_status']);
        $this->assertSame('Disetujui', $events[$approved->id]['status_label']);
        $this->assertSame('cancelled', $events[$cancelled->id]['display_status']);
        $this->assertSame('Dibatalkan', $events[$cancelled->id]['status_label']);
        $this->assertSame('Batal oleh peminjam', $events[$cancelled->id]['status_reason']);
        $this->assertSame('expired', $events[$expired->id]['display_status']);
        $this->assertSame('Kedaluwarsa', $events[$expired->id]['status_label']);
        $this->assertSame('Kedaluwarsa', $events[$expired->id]['status_reason']);
        $this->assertSame('rejected', $events[$rejected->id]['display_status']);
        $this->assertSame('Ditolak', $events[$rejected->id]['status_label']);
        $this->assertSame('Proposal kurang lengkap', $events[$rejected->id]['status_reason']);
        $this->assertSame('completed', $events[$completed->id]['display_status']);
        $this->assertSame('Selesai', $events[$completed->id]['status_label']);
        $this->assertNull($events[$completed->id]['status_reason']);
    }

    public function test_calendar_excludes_soft_deleted_documents(): void
    {
        $document = $this->reservationOn('2026-12-01');
        Sanctum::actingAs($document->creator);

        $document->delete();

        $response = $this->getJson('/api/calendar?from=2026-12-01&to=2026-12-31');

        $response->assertOk()->assertJsonCount(0, 'data.events');

        $raw = json_decode($response->getContent());
        $this->assertInstanceOf(\stdClass::class, $raw->data->documents);
        $this->assertCount(0, (array) $raw->data->documents);
    }

    public function test_calendar_keeps_completed_booking_when_room_is_soft_deleted(): void
    {
        $room = $this->room();
        $document = $this->reservationOn('2026-12-01');
        $document->update(['status' => 'APPROVED']);
        $document->roomBookings()->update(['status' => 'COMPLETED']);

        $room->delete();

        Sanctum::actingAs($document->creator);

        $response = $this->getJson('/api/calendar?from=2026-12-01&to=2026-12-31');

        $response->assertOk()
            ->assertJsonPath('data.events.0.room.code', 'F107')
            ->assertJsonPath('data.events.0.room.name', 'F107')
            ->assertJsonPath('data.events.0.display_status', 'completed');
    }

    public function test_calendar_filters_by_room_and_validates_range(): void
    {
        $roomA = $this->room();
        $documentA = $this->reservationOn('2026-12-01');

        $roomB = Room::firstOrCreate(['code' => 'F108'], [
            'name' => 'F108',
            'status' => 'ACTIVE',
            'is_bookable_weekday' => true,
            'weekday_max_end_time' => '16:30',
        ]);
        $documentB = $this->makeDraftReservation([
            'mode' => 'one_room_many_dates',
            'slots' => [[
                'room_id' => $roomB->id,
                'booking_date' => '2026-12-01',
                'start_time' => '13:00',
                'end_time' => '15:00',
            ]],
        ]);

        Sanctum::actingAs($documentA->creator);

        $this->getJson("/api/calendar?from=2026-12-01&to=2026-12-31&room_id={$roomB->id}")
            ->assertOk()
            ->assertJsonCount(1, 'data.events')
            ->assertJsonPath('data.events.0.document_id', $documentB->id)
            ->assertJsonPath('data.events.0.room.id', $roomB->id);

        $this->getJson('/api/calendar?from=2026-12-31&to=2026-12-01')->assertStatus(422);
        $this->getJson('/api/calendar?from=2026-01-01&to=2027-01-02')->assertStatus(422);
        $this->getJson('/api/calendar?from=2026-12-01&to=2026-12-31&room_id=999999')->assertStatus(422);
    }

    public function test_calendar_requires_authentication_and_assigned_role(): void
    {
        $this->getJson('/api/calendar?from=2026-12-01&to=2026-12-31')->assertUnauthorized();

        $userWithoutRole = User::factory()->create([
            'role_id' => null,
            'is_profile_completed' => true,
        ]);

        Sanctum::actingAs($userWithoutRole);

        $this->getJson('/api/calendar?from=2026-12-01&to=2026-12-31')->assertForbidden();
    }
}
