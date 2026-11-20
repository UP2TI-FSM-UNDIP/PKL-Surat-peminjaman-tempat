<?php

namespace App\Services;

use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class RoomBookingService
{
    public function listBookings(User $user, array $filters)
    {
        $query = RoomBooking::with(['room', 'document', 'bookedBy.unit', 'approvedBy']);

        if (!empty($filters['my_bookings'])) {
            $query->where('booked_by', $user->id);
        }

        if (!empty($filters['my_unit_bookings']) && $user->unit_id) {
            $query->whereHas('bookedBy', function ($q) use ($user) {
                $q->where('unit_id', $user->unit_id);
            });
        }

        if (isset($filters['document_id'])) {
            $query->where('document_id', $filters['document_id']);
        }

        if (isset($filters['room_id'])) {
            $query->where('room_id', $filters['room_id']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['date_from'])) {
            $query->where('booking_date', '>=', $filters['date_from']);
        }
        if (isset($filters['date_to'])) {
            $query->where('booking_date', '<=', $filters['date_to']);
        }

        $bookings = $query->latest('booking_date')->latest('start_time')->paginate($filters['per_page'] ?? 15);

        $bookings->getCollection()->transform(function ($booking) {
            $data = $booking->toArray();
            $data['booked_by_user'] = $booking->bookedBy ? [
                'id' => $booking->bookedBy->id,
                'name' => $booking->bookedBy->name,
                'email' => $booking->bookedBy->email,
                'unit_code' => $booking->bookedBy->unit?->code,
                'unit_name' => $booking->bookedBy->unit?->name,
            ] : null;
            return $data;
        });

        return $bookings;
    }

    public function approveBooking(RoomBooking $booking, User $user): bool
    {
        return DB::transaction(function () use ($booking, $user) {
            $result = $booking->approve($user);

            if (!$result) {
                throw new \Exception('Ruangan tidak tersedia. Mungkin sudah ada booking lain pada waktu yang sama.', 400);
            }

            return true;
        });
    }

    public function rejectBooking(RoomBooking $booking, User $user, string $reason): void
    {
        $booking->reject($user, $reason);
    }

    public function cancelBooking(RoomBooking $booking, ?string $reason): void
    {
        $booking->cancel($reason);
    }

    public function completeBooking(RoomBooking $booking): void
    {
        $booking->complete();
    }

    public function deleteBooking(RoomBooking $booking): void
    {
        if ($booking->status === 'APPROVED') {
            throw new \Exception('Booking yang sudah disetujui tidak bisa dihapus. Silakan batalkan terlebih dahulu.', 400);
        }

        $booking->delete();
    }

    public function getStatistics(User $user): array
    {
        $stats = [
            'total' => RoomBooking::count(),
            'pending' => RoomBooking::pending()->count(),
            'approved' => RoomBooking::approved()->count(),
            'rejected' => RoomBooking::where('status', 'REJECTED')->count(),
            'cancelled' => RoomBooking::where('status', 'CANCELLED')->count(),
            'completed' => RoomBooking::where('status', 'COMPLETED')->count(),
            'my_bookings' => RoomBooking::where('booked_by', $user->id)->count(),
            'my_pending_bookings' => RoomBooking::where('booked_by', $user->id)->pending()->count(),
        ];

        if ($user->unit_id) {
            $stats['my_unit_bookings'] = RoomBooking::whereHas('bookedBy', function ($q) use ($user) {
                $q->where('unit_id', $user->unit_id);
            })->count();
        }

        return $stats;
    }

    /**
     * Rekapitulasi penggunaan ruangan per minggu
     */
    public function weeklyReport(array $filters): array
    {
        $weekStart = isset($filters['week_start'])
            ? Carbon::parse($filters['week_start'])->startOfWeek()
            : Carbon::now()->startOfWeek();

        $weekEnd = $weekStart->copy()->endOfWeek();

        $rooms = Room::where('status', 'ACTIVE')->orderBy('name')->get();

        $bookings = RoomBooking::with(['room', 'bookedBy.unit'])
            ->whereBetween('booking_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->whereIn('status', ['APPROVED', 'PENDING', 'COMPLETED'])
            ->get();

        $roomUsage = [];
        foreach ($rooms as $room) {
            $roomBookings = $bookings->where('room_id', $room->id);

            $totalHours = $roomBookings->sum(function ($b) {
                $start = Carbon::parse($b->start_time);
                $end = Carbon::parse($b->end_time);
                return $start->diffInMinutes($end) / 60;
            });

            $roomUsage[] = [
                'room_id' => $room->id,
                'room_name' => $room->name,
                'room_code' => $room->code,
                'total_bookings' => $roomBookings->count(),
                'approved' => $roomBookings->where('status', 'APPROVED')->count(),
                'pending' => $roomBookings->where('status', 'PENDING')->count(),
                'completed' => $roomBookings->where('status', 'COMPLETED')->count(),
                'total_hours' => round($totalHours, 1),
                'bookings' => $roomBookings->map(fn($b) => [
                    'id' => $b->id,
                    'date' => $b->booking_date->format('Y-m-d'),
                    'day' => $b->booking_date->translatedFormat('l'),
                    'start_time' => substr($b->start_time, 0, 5),
                    'end_time' => substr($b->end_time, 0, 5),
                    'purpose' => $b->purpose,
                    'status' => $b->status,
                    'booked_by' => $b->bookedBy?->name,
                    'unit' => $b->bookedBy?->unit?->name,
                ])->values(),
            ];
        }

        $summary = [
            'week_start' => $weekStart->toDateString(),
            'week_end' => $weekEnd->toDateString(),
            'total_bookings' => $bookings->count(),
            'total_approved' => $bookings->where('status', 'APPROVED')->count(),
            'total_pending' => $bookings->where('status', 'PENDING')->count(),
            'total_completed' => $bookings->where('status', 'COMPLETED')->count(),
            'rooms_used' => $bookings->pluck('room_id')->unique()->count(),
            'total_rooms' => $rooms->count(),
        ];

        return [
            'summary' => $summary,
            'room_usage' => $roomUsage,
        ];
    }

    /**
     * Generate receipt data for printing
     */
    public function getReceiptData(RoomBooking $booking): array
    {
        $booking->load(['room', 'document', 'bookedBy.unit', 'approvedBy']);

        return [
            'booking_id' => $booking->id,
            'booking_date' => $booking->booking_date->translatedFormat('d F Y'),
            'day' => $booking->booking_date->translatedFormat('l'),
            'start_time' => substr($booking->start_time, 0, 5),
            'end_time' => substr($booking->end_time, 0, 5),
            'duration_hours' => $booking->getDurationInHours(),
            'purpose' => $booking->purpose,
            'special_requirements' => $booking->special_requirements,
            'expected_participants' => $booking->expected_participants,
            'status' => $booking->status,

            'room' => [
                'name' => $booking->room->name,
                'code' => $booking->room->code,
                'capacity' => $booking->room->capacity,
            ],

            'booked_by' => [
                'name' => $booking->bookedBy?->name,
                'email' => $booking->bookedBy?->email,
                'unit' => $booking->bookedBy?->unit?->name,
            ],

            'approved_by' => $booking->approvedBy ? [
                'name' => $booking->approvedBy->name,
                'approved_at' => $booking->approved_at?->translatedFormat('d F Y H:i'),
            ] : null,

            'document' => $booking->document ? [
                'id' => $booking->document->id,
                'title' => $booking->document->title,
                'status' => $booking->document->status,
            ] : null,

            'created_at' => $booking->created_at->translatedFormat('d F Y H:i'),
            'qr_url' => url("/api/room-bookings/{$booking->id}/qrcode"),
            'receipt_url' => url("/api/room-bookings/{$booking->id}/receipt"),
        ];
    }
}

