<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentLog;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\User;
use App\Models\Workflow;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReservationService
{
    public function __construct(
        private BookingRuleService $rules,
        private BookingPolicyService $policies,
        private ProposalCompletenessService $completeness,
    ) {}

    public function create(User $user, array $data): Document
    {
        $policy = $this->policies->active();
        $slots = $this->normalizeSlots($data['slots']);
        $this->assertMode($data['mode'], $slots, $policy);
        $this->assertNoOverlap($slots);

        if (($data['buka_sekat'] ?? false) && $data['mode'] !== 'one_date_many_rooms') {
            throw ValidationException::withMessages(['buka_sekat' => ['Buka sekat hanya untuk mode satu tanggal banyak ruang.']]);
        }
        if ($data['buka_sekat'] ?? false) {
            $this->assertSekat($slots);
        }

        return DB::transaction(function () use ($user, $data, $slots, $policy) {
            $roomIds = collect($slots)->pluck('room_id')->unique()->sort()->values()->all();
            Room::whereIn('id', $roomIds)->orderBy('id')->lockForUpdate()->get();

            $conflicts = $this->findConflicts($slots);
            if ($conflicts) {
                throw ValidationException::withMessages(['slots' => ['Beberapa slot bentrok.'], 'conflicts' => $conflicts]);
            }

            foreach ($slots as $slot) {
                $this->rules->validateSlot($slot, $policy);
            }
            $this->assertCapacity($slots, $data['expected_participants'] ?? null);
            $this->assertTotalHours($slots, $policy);

            $earliest = collect($slots)->min('booking_date');
            $snapshot = $this->policies->computeDeadline(
                CarbonImmutable::today('Asia/Jakarta'),
                CarbonImmutable::parse($earliest, 'Asia/Jakarta')
            );

            $workflow = Workflow::where('applies_to_category', 'UMUM')->firstOrFail();
            $document = Document::create([
                'workflow_id' => $workflow->id,
                'title' => $data['purpose'],
                'content' => $this->contentFromSlots($data['mode'], $slots, $data),
                'unit_id' => $user->unit_id,
                'creator_id' => $user->id,
                'status' => 'DRAFT',
                'current_step_order' => 1,
                'reservation_deadline' => $snapshot['computed_deadline'],
                'deadline_policy_id' => $snapshot['policy_id'],
                'deadline_rule_snapshot' => $snapshot,
            ]);

            foreach ($slots as $index => $slot) {
                RoomBooking::create([
                    'document_id' => $document->id,
                    'room_id' => $slot['room_id'],
                    'booked_by' => $user->id,
                    'booking_date' => $slot['booking_date'],
                    'start_time' => $slot['start_time'],
                    'end_time' => $slot['end_time'],
                    'purpose' => $data['purpose'],
                    'expected_participants' => $data['expected_participants'] ?? null,
                    'slot_index' => $index,
                    'is_sekat' => (bool) ($data['buka_sekat'] ?? false),
                    'status' => 'PENDING',
                ]);
            }

            DocumentLog::create([
                'document_id' => $document->id,
                'user_id' => $user->id,
                'action' => 'CREATED',
                'note' => 'Reservasi dibuat',
            ]);

            if ($user->isAdmin() && ($data['intent'] ?? null) === 'submit') {
                $document->update(['status' => 'APPROVED', 'completed_at' => now()]);
                $document->roomBookings()->where('status', 'PENDING')->update(['status' => 'APPROVED', 'approved_by' => $user->id, 'approved_at' => now()]);
                DocumentLog::create([
                    'document_id' => $document->id,
                    'user_id' => $user->id,
                    'action' => 'APPROVED',
                    'note' => 'Manual booking oleh admin',
                ]);
            }

            return $document->load('roomBookings');
        });
    }

    public function updateProposal(Document $document, User $user, array $data, ?\Illuminate\Http\UploadedFile $file = null): Document
    {
        if (!in_array($document->status, ['DRAFT', 'REVISION'], true)) {
            throw ValidationException::withMessages(['status' => ['Status tidak dapat diubah.']]);
        }

        $reservationKeys = ['mode', 'slots', 'room_id', 'booking_date', 'start_time', 'end_time', 'purpose', 'ketua_pelaksana_nama', 'ketua_pelaksana_identitas', 'ketua_pelaksana_hp', 'expected_participants', 'buka_sekat'];
        $content = $data['content'] ?? [];
        $current = $document->content ?? [];

        foreach ($reservationKeys as $key) {
            if (array_key_exists($key, $content) && $content[$key] != ($current[$key] ?? null)) {
                throw ValidationException::withMessages(['content' => ["Field {$key} tidak dapat diubah."]]);
            }
        }

        $allowed = ['event_name', 'event_nature', 'event_form', 'objectives', 'benefits', 'target_audience', 'equipment_items'];
        $merge = array_intersect_key($content, array_flip($allowed));
        if (($data['clear_equipment'] ?? false) === true) {
            $merge['equipment_items'] = [];
        }
        $document->update([
            'content' => array_merge($current, $merge),
            'file_proposal' => $file ? $file->store('documents/proposals', 'private') : $document->file_proposal,
        ]);

        return $this->completeness->sync($document);
    }

    public function cancel(Document $document, User $user, ?string $reason = null): Document
    {
        if (!in_array($document->status, ['DRAFT', 'REVISION', 'IN_PROGRESS'], true)) {
            throw ValidationException::withMessages(['status' => ['Status tidak dapat dibatalkan.']]);
        }

        DB::transaction(function () use ($document, $user, $reason) {
            $document->update([
                'status' => 'CANCELLED',
                'cancelled_at' => now(),
                'cancelled_by' => $user->id,
                'current_holder_id' => null,
            ]);
            $document->roomBookings()->where('status', 'PENDING')->update([
                'status' => 'CANCELLED',
                'cancelled_at' => now(),
                'cancelled_by' => $user->id,
                'rejection_reason' => $reason ?? 'Dibatalkan',
            ]);
            DocumentLog::create([
                'document_id' => $document->id,
                'user_id' => $user->id,
                'action' => 'CANCELLED',
                'note' => $reason,
            ]);
        });

        return $document->fresh(['roomBookings', 'logs']);
    }

    public function summary(Document $document): array
    {
        $document->load(['roomBookings.room', 'logs']);

        return [
            'document' => $document,
            'slots' => $document->roomBookings->map(fn ($booking) => [
                'room_id' => $booking->room_id,
                'room_code' => $booking->room?->code,
                'room_name' => $booking->room?->name,
                'booking_date' => $booking->booking_date->format('Y-m-d'),
                'start_time' => substr($booking->start_time, 0, 5),
                'end_time' => substr($booking->end_time, 0, 5),
                'is_sekat' => $booking->is_sekat,
            ])->values()->all(),
            'equipment_items' => $document->content['equipment_items'] ?? [],
            'completeness' => $this->completeness->evaluate($document),
            'proposal_completed_at' => $document->proposal_completed_at,
            'reservation_deadline' => $document->reservation_deadline?->format('Y-m-d'),
            'status' => $document->status,
            'timeline' => $document->logs->map(fn ($log) => [
                'action' => $log->action,
                'note' => $log->note,
                'at' => $log->created_at,
            ])->values()->all(),
        ];
    }

    public function checkAvailability(array $slots, ?int $excludeDocumentId = null): array
    {
        $result = [];

        foreach ($this->normalizeSlots($slots) as $index => $slot) {
            $conflicts = $this->findConflicts([$slot], $excludeDocumentId);
            $result[$index] = [
                'slot_index' => $index,
                'available' => count($conflicts) === 0,
                'reasons' => count($conflicts) === 0 ? [] : ['ROOM_CONFLICT'],
                'conflicts' => $conflicts,
            ];
        }

        return ['available' => collect($result)->every(fn ($row) => $row['available']), 'slots' => array_values($result)];
    }

    private function normalizeSlots(array $slots): array
    {
        return collect($slots)
            ->map(fn (array $slot) => [
                'room_id' => (int) $slot['room_id'],
                'booking_date' => $slot['booking_date'],
                'start_time' => substr($slot['start_time'], 0, 5),
                'end_time' => substr($slot['end_time'], 0, 5),
            ])
            ->sortBy(fn (array $slot) => $slot['booking_date'] . '|' . $slot['start_time'] . '|' . $slot['room_id'])
            ->values()
            ->all();
    }

    private function contentFromSlots(string $mode, array $slots, array $data): array
    {
        $first = $slots[0];
        $rooms = Room::whereIn('id', collect($slots)->pluck('room_id')->unique())->get()->keyBy('id');

        return [
            'mode' => $mode,
            'slots' => collect($slots)->map(fn (array $slot) => $slot + [
                'room_code' => $rooms[$slot['room_id']]->code,
                'room_name' => $rooms[$slot['room_id']]->name,
            ])->all(),
            'room_id' => $first['room_id'],
            'room_code' => $rooms[$first['room_id']]->code,
            'room_name' => $rooms[$first['room_id']]->name,
            'booking_date' => $first['booking_date'],
            'start_time' => $first['start_time'],
            'end_time' => $first['end_time'],
            'purpose' => $data['purpose'],
            'ketua_pelaksana_nama' => $data['ketua_pelaksana_nama'],
            'ketua_pelaksana_identitas' => $data['ketua_pelaksana_identitas'],
            'ketua_pelaksana_hp' => $data['ketua_pelaksana_hp'],
            'expected_participants' => $data['expected_participants'] ?? null,
            'equipment_items' => [],
            'buka_sekat' => (bool) ($data['buka_sekat'] ?? false),
        ];
    }

    private function assertNoOverlap(array $slots): void
    {
        $seen = [];
        foreach ($slots as $slot) {
            $key = $slot['room_id'] . '|' . $slot['booking_date'];
            foreach ($seen[$key] ?? [] as $other) {
                if ($slot['start_time'] < $other['end_time'] && $slot['end_time'] > $other['start_time']) {
                    throw ValidationException::withMessages(['slots' => ['Slot dalam satu pengajuan tidak boleh overlap.']]);
                }
            }
            $seen[$key][] = $slot;
        }
    }

    private function assertCapacity(array $slots, ?int $expectedParticipants): void
    {
        if (!$expectedParticipants) {
            return;
        }

        foreach (Room::whereIn('id', collect($slots)->pluck('room_id'))->get() as $room) {
            if ($room->capacity !== null && $expectedParticipants > $room->capacity) {
                throw ValidationException::withMessages(['expected_participants' => ["Melebihi kapasitas {$room->code} ({$room->capacity})."]]);
            }
        }
    }

    private function assertTotalHours(array $slots, $policy): void
    {
        if ($policy->max_total_room_hours === null) {
            return;
        }

        $totalMinutes = collect($slots)->sum(fn (array $slot) => $this->minutes($slot['end_time']) - $this->minutes($slot['start_time']));
        if ($totalMinutes > ($policy->max_total_room_hours * 60)) {
            throw ValidationException::withMessages(['slots' => ['Total durasi melebihi batas policy.']]);
        }
    }

    private function minutes(string $time): int
    {
        [$hour, $minute] = explode(':', substr($time, 0, 5));
        return ((int) $hour * 60) + (int) $minute;
    }

    private function assertSekat(array $slots): void
    {
        if (count($slots) < 2) {
            throw ValidationException::withMessages(['buka_sekat' => ['Buka sekat membutuhkan minimal dua ruang.']]);
        }

        $rooms = Room::whereIn('id', collect($slots)->pluck('room_id'))->get();
        $groups = $rooms->pluck('adjacent_group')->unique();
        $positions = $rooms->pluck('adjacent_position')->filter()->sort()->values();

        if ($groups->count() !== 1 || $groups->first() === null) {
            throw ValidationException::withMessages(['buka_sekat' => ['Semua ruang harus berada di grup sekat yang sama.']]);
        }
        if ($positions->count() !== $rooms->count() || $positions->values()->all() !== range($positions->min(), $positions->max())) {
            throw ValidationException::withMessages(['buka_sekat' => ['Posisi ruang harus berurutan.']]);
        }
    }

    private function findConflicts(array $slots, ?int $excludeDocumentId = null): array
    {
        $conflicts = [];

        foreach ($slots as $slot) {
            $rows = RoomBooking::whereIn('status', ['PENDING', 'APPROVED', 'COMPLETED'])
                ->where('room_id', $slot['room_id'])
                ->whereDate('booking_date', $slot['booking_date'])
                ->where('start_time', '<', $slot['end_time'])
                ->where('end_time', '>', $slot['start_time'])
                ->when($excludeDocumentId, fn ($q) => $q->where('document_id', '!=', $excludeDocumentId))
                ->get();

            foreach ($rows as $row) {
                $conflicts[] = [
                    'booking_id' => $row->id,
                    'document_id' => $row->document_id,
                    'room_id' => $row->room_id,
                    'booking_date' => $row->booking_date->format('Y-m-d'),
                    'start_time' => substr($row->start_time, 0, 5),
                    'end_time' => substr($row->end_time, 0, 5),
                ];
            }
        }

        return $conflicts;
    }

    private function assertMode(string $mode, array $slots, $policy): void
    {
        $limit = $mode === 'one_room_many_dates'
            ? $policy->max_dates_per_room
            : $policy->max_rooms_per_date;

        if (count($slots) > $limit) {
            throw ValidationException::withMessages(['slots' => ["Maksimal {$limit} slot untuk mode ini."]]);
        }

        if ($mode === 'one_room_many_dates' && collect($slots)->pluck('room_id')->unique()->count() !== 1) {
            throw ValidationException::withMessages(['slots' => ['Mode satu ruang banyak tanggal harus memakai satu ruang.']]);
        }
        if ($mode === 'one_room_many_dates' && collect($slots)->pluck('booking_date')->duplicates()->isNotEmpty()) {
            throw ValidationException::withMessages(['slots' => ['Tanggal pada mode ini harus berbeda.']]);
        }
        if ($mode === 'one_date_many_rooms' && collect($slots)->pluck('booking_date')->unique()->count() !== 1) {
            throw ValidationException::withMessages(['slots' => ['Mode satu tanggal banyak ruang harus memakai satu tanggal.']]);
        }
        if ($mode === 'one_date_many_rooms' && collect($slots)->pluck('room_id')->duplicates()->isNotEmpty()) {
            throw ValidationException::withMessages(['slots' => ['Ruang pada mode ini harus berbeda.']]);
        }
    }
}
