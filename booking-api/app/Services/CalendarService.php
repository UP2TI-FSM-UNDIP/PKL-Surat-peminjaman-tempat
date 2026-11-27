<?php

namespace App\Services;

use App\Models\Document;
use App\Models\RoomBooking;

class CalendarService
{
    public function forRange(string $from, string $to, ?int $roomId = null): array
    {
        $bookings = RoomBooking::query()
            ->with([
                'room' => fn ($query) => $query->withTrashed()->select('id', 'code', 'name'),
                'document.creator:id,name,unit_id',
                'document.creator.unit:id,code,name',
            ])
            ->whereHas('document')
            ->whereBetween('booking_date', [$from, $to])
            ->when($roomId, fn ($query) => $query->where('room_id', $roomId))
            ->orderBy('booking_date')
            ->orderBy('start_time')
            ->orderBy('room_id')
            ->get();

        $documents = [];

        $events = $bookings->map(function (RoomBooking $booking) use (&$documents): array {
            $document = $booking->document;
            $content = $document->content ?? [];

            [$displayStatus, $statusLabel] = $this->displayStatus($booking, $document);

            $documents[$document->id] ??= $this->documentSummary($document, $content);

            return [
                'id' => (string) $booking->id,
                'document_id' => $document->id,
                'title' => $this->title($document, $content),
                'room' => [
                    'id' => $booking->room->id,
                    'code' => $booking->room->code,
                    'name' => $booking->room->name,
                ],
                'booking_date' => $booking->booking_date->format('Y-m-d'),
                'start_time' => substr($booking->start_time, 0, 5),
                'end_time' => substr($booking->end_time, 0, 5),
                'display_status' => $displayStatus,
                'status_label' => $statusLabel,
                'status_reason' => $this->statusReason($booking, $displayStatus),
            ];
        })->values()->all();

        return [
            'from' => $from,
            'to' => $to,
            'events' => $events,
            'documents' => (object) $documents,
        ];
    }

    private function displayStatus(RoomBooking $booking, Document $document): array
    {
        if ($booking->status === 'COMPLETED') {
            return ['completed', 'Selesai'];
        }

        if ($document->status === 'EXPIRED') {
            return ['expired', 'Kedaluwarsa'];
        }

        if ($booking->status === 'CANCELLED' || $document->status === 'CANCELLED') {
            return ['cancelled', 'Dibatalkan'];
        }

        if ($booking->status === 'REJECTED' || $document->status === 'REJECTED') {
            return ['rejected', 'Ditolak'];
        }

        if ($document->status === 'APPROVED') {
            return ['active', 'Disetujui'];
        }

        if ($document->status === 'IN_PROGRESS' && $document->proposal_completed_at !== null) {
            return ['active', 'Aktif'];
        }

        return ['reservation', 'Reservasi'];
    }

    private function statusReason(RoomBooking $booking, string $displayStatus): ?string
    {
        if (!in_array($displayStatus, ['cancelled', 'expired', 'rejected'], true)) {
            return null;
        }

        return filled($booking->rejection_reason) ? $booking->rejection_reason : null;
    }

    private function title(Document $document, array $content): string
    {
        return filled($content['event_name'] ?? null)
            ? $content['event_name']
            : $document->title;
    }

    private function documentSummary(Document $document, array $content): array
    {
        return [
            'id' => $document->id,
            'public_id' => $document->public_id,
            'purpose' => filled($content['purpose'] ?? null)
                ? $content['purpose']
                : $document->title,
            'status' => $document->status,
            'creator' => [
                'id' => $document->creator->id,
                'name' => $document->creator->name,
                'unit_code' => $document->creator->unit?->code,
                'unit_name' => $document->creator->unit?->name,
            ],
            'proposal_completed_at' => $document->proposal_completed_at?->toIso8601String(),
            'reservation_deadline' => $document->reservation_deadline?->format('Y-m-d'),
            'expected_participants' => $content['expected_participants'] ?? null,
            'buka_sekat' => (bool) ($content['buka_sekat'] ?? false),
            'equipment_items' => $content['equipment_items'] ?? [],
            'slots' => $content['slots'] ?? [],
        ];
    }
}
