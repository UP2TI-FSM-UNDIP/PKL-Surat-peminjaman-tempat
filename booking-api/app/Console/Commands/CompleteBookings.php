<?php

namespace App\Console\Commands;

use App\Services\BookingCompletionService;
use Illuminate\Console\Command;

class CompleteBookings extends Command
{
    protected $signature = 'bookings:complete';

    public function handle(BookingCompletionService $service): int
    {
        $count = $service->completePastBookings();
        $this->info("Completed: {$count}");

        return self::SUCCESS;
    }
}
