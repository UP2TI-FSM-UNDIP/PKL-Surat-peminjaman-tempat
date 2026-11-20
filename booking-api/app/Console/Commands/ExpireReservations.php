<?php

namespace App\Console\Commands;

use App\Services\ReservationExpiryService;
use Illuminate\Console\Command;

class ExpireReservations extends Command
{
    protected $signature = 'reservations:expire {--dry-run}';

    public function handle(ReservationExpiryService $service): int
    {
        $result = $service->expire((bool) $this->option('dry-run'));
        $this->info("Expired: {$result['count']} (dry-run: " . ($result['dry_run'] ? 'yes' : 'no') . ')');

        return self::SUCCESS;
    }
}
