<?php

namespace App\Http\Controllers;

use App\Models\RoomBooking;
use App\Services\RoomBookingService;
use Illuminate\Http\Request;

class RoomBookingController extends Controller
{
    protected RoomBookingService $bookingService;

    public function __construct(RoomBookingService $bookingService)
    {
        $this->bookingService = $bookingService;
    }

    public function index(Request $request)
    {
        $bookings = $this->bookingService->listBookings($request->user(), $request->all());

        return response()->json([
            'success' => true,
            'data' => $bookings,
        ]);
    }

    public function show(Request $request, $id)
    {
        $booking = RoomBooking::with([
            'room',
            'document.workflow',
            'bookedBy.unit',
            'approvedBy',
        ])->findOrFail($id);

        if (!$this->canViewBooking($booking, $request->user())) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk melihat booking ini',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $booking,
        ]);
    }

    public function complete(Request $request, $id)
    {
        $booking = RoomBooking::findOrFail($id);

        abort_if(
            !$request->user() || !in_array($request->user()->role?->slug, ['admin', 'wadek2', 'manajer-tata-usaha', 'spv-sumberdaya'], true),
            403
        );

        // Status check
        if ($booking->status !== 'APPROVED') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya booking dengan status APPROVED yang bisa diselesaikan',
            ], 400);
        }

        $this->bookingService->completeBooking($booking);

        return response()->json([
            'success' => true,
            'message' => 'Booking berhasil diselesaikan',
            'data' => $booking->fresh()->load(['room', 'document', 'bookedBy']),
        ]);
    }

    public function statistics(Request $request)
    {
        $stats = $this->bookingService->getStatistics($request->user());

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    public function weeklyReport(Request $request)
    {
        $report = $this->bookingService->weeklyReport($request->all());

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    public function receipt(Request $request, $id)
    {
        $booking = RoomBooking::findOrFail($id);
        $user = $request->user();

        if (!$this->canViewBooking($booking, $user)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk melihat bukti peminjaman ini',
            ], 403);
        }

        $receiptData = $this->bookingService->getReceiptData($booking);

        return response()->json([
            'success' => true,
            'data' => $receiptData,
        ]);
    }

    public function qrcode(Request $request, $id)
    {
        $booking = RoomBooking::findOrFail($id);

        if (!$this->canViewBooking($booking, $request->user())) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke bukti peminjaman ini',
            ], 403);
        }

        if (!in_array($booking->status, ['APPROVED', 'COMPLETED'])) {
            return response()->json([
                'success' => false,
                'message' => 'QR code bukti peminjaman hanya tersedia untuk peminjaman yang sudah disetujui',
            ], 400);
        }

        $verificationUrl = $booking->verificationUrl();

        try {
            $qrCode = \SimpleSoftwareIO\QrCode\Facades\QrCode::format('png')
                ->size(300)
                ->margin(2)
                ->errorCorrection('M')
                ->generate($verificationUrl);
            $contentType = 'image/png';
            $filename = 'bukti-peminjaman-' . $booking->id . '.png';
        } catch (\Throwable $e) {
            if (! str_contains($e->getMessage(), 'imagick')) {
                throw $e;
            }

            // Lingkungan tanpa ext-imagick tetap dapat menyajikan QR sebagai SVG.
            $qrCode = \SimpleSoftwareIO\QrCode\Facades\QrCode::format('svg')
                ->size(300)
                ->margin(2)
                ->errorCorrection('M')
                ->generate($verificationUrl);
            $contentType = 'image/svg+xml';
            $filename = 'bukti-peminjaman-' . $booking->id . '.svg';
        }

        return response($qrCode, 200, [
            'Content-Type' => $contentType,
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
            'Cache-Control' => 'private, max-age=3600',
            'X-Verification-Url' => $verificationUrl,
        ]);
    }

    /**
     * Halaman verifikasi publik (tujuan QR code). Tidak butuh login, tetapi
     * wajib membawa token HMAC yang hanya ada di QR code. Hanya mengembalikan
     * data yang diperlukan untuk memverifikasi peminjaman (tanpa data pribadi).
     */
    public function verify(Request $request, $id)
    {
        $booking = RoomBooking::with(['room', 'bookedBy.unit', 'approvedBy', 'document'])->find($id);

        if (!$booking || !$booking->isValidVerificationToken($request->query('token'))) {
            return response()->json([
                'success' => false,
                'message' => 'Bukti peminjaman tidak valid atau tidak ditemukan',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $booking->id,
                'status' => $booking->status,
                'room' => $booking->room ? [
                    'name' => $booking->room->name,
                    'code' => $booking->room->code,
                ] : null,
                'booking_date' => $booking->booking_date->toDateString(),
                'day' => $booking->booking_date->translatedFormat('l'),
                'start_time' => substr($booking->start_time, 0, 5),
                'end_time' => substr($booking->end_time, 0, 5),
                'purpose' => $booking->purpose,
                'event_name' => $booking->document?->content['event_name'] ?? null,
                'unit' => $booking->bookedBy?->unit?->name,
                'approved_by' => $booking->approvedBy?->name,
                'approved_at' => $booking->approved_at?->toIso8601String(),
            ],
        ]);
    }

    /**
     * Siapa yang boleh melihat detail / bukti / QR booking: peminjam, admin,
     * pengelola sumberdaya, approver booking, atau pihak yang punya akses ke dokumennya.
     */
    private function canViewBooking(RoomBooking $booking, $user): bool
    {
        return $booking->booked_by === $user->id
            || in_array($user->role?->slug, ['admin', 'spv-sumberdaya'], true)
            || $booking->approved_by === $user->id
            || ($booking->document && app(\App\Services\DocumentService::class)->checkDocumentAccess($booking->document, $user));
    }
}
