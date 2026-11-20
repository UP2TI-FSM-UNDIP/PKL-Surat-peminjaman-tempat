<?php

namespace App\Services;

use App\Models\RoomBooking;

class BookingCompletionService
{
    public function completePastBookings(): int
    {
        return RoomBooking::where('status', 'APPROVED')
            ->whereDate('booking_date', '<', today('Asia/Jakarta'))
            ->update(['status' => 'COMPLETED']);
    }
}
