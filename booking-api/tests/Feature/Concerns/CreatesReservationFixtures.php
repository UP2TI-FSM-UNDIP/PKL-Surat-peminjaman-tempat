<?php

namespace Tests\Feature\Concerns;

use App\Models\Document;
use App\Models\Role;
use App\Models\Room;
use App\Models\Unit;
use App\Models\User;
use App\Services\ReservationService;
use Carbon\CarbonImmutable;

trait CreatesReservationFixtures
{
    protected function userWithRole(string $slug, string $unitCode = 'FSM'): User
    {
        $role = Role::firstOrCreate(['slug' => $slug], ['name' => $slug]);
        $unit = Unit::firstOrCreate(['code' => $unitCode], ['name' => 'FSM', 'category' => 'FAKULTAS']);

        return User::factory()->create([
            'role_id' => $role->id,
            'unit_id' => $unit->id,
            'is_profile_completed' => true,
        ]);
    }

    protected function makeDraftReservation(array $overrides = []): Document
    {
        $borrower = $this->userWithRole('peminjam');
        $room = Room::firstOrCreate(['code' => 'F107'], [
            'name' => 'F107',
            'status' => 'ACTIVE',
            'is_bookable_weekday' => true,
            'weekday_max_end_time' => '16:30',
        ]);

        $bookingDate = CarbonImmutable::today('Asia/Jakarta')->addDays(11);

        while ($bookingDate->isSunday()) {
            $bookingDate = $bookingDate->addDay();
        }

        return app(ReservationService::class)->create($borrower, array_merge([
            'mode' => 'one_room_many_dates',
            'slots' => [[
                'room_id' => $room->id,
                'booking_date' => $bookingDate->toDateString(),
                'start_time' => '09:00',
                'end_time' => '12:00',
            ]],
            'purpose' => 'Seminar',
            'ketua_pelaksana_nama' => 'Ketua',
            'ketua_pelaksana_identitas' => '24060121120001',
            'ketua_pelaksana_hp' => '081234567890',
            'intent' => 'reservation',
        ], $overrides));
    }

    protected function makeCompleteDraftReservation(): Document
    {
        \Illuminate\Support\Facades\Storage::fake('private');
        \Illuminate\Support\Facades\Storage::disk('private')->put('documents/proposals/test.pdf', '%PDF-1.4 test');
        $document = $this->makeDraftReservation();

        $document->update([
            'file_proposal' => 'documents/proposals/test.pdf',
            'content' => array_merge($document->content, [
                'event_name' => 'Seminar',
                'event_nature' => 'Akademik',
                'event_form' => 'Offline',
                'objectives' => 'Tujuan',
                'benefits' => 'Manfaat',
                'target_audience' => 'Mahasiswa',
                'ketua_pelaksana_nama' => 'Ketua',
                'ketua_pelaksana_identitas' => '24060121120001',
                'ketua_pelaksana_hp' => '081234567890',
                'equipment_items' => [],
            ]),
            'proposal_completed_at' => now(),
        ]);

        return $document->fresh();
    }
}
