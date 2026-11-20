<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentLog;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class ReservationExpiryService
{
    public function expire(bool $dryRun): array
    {
        $query = Document::whereIn('status', ['DRAFT', 'REVISION'])
            ->whereNotNull('reservation_deadline')
            ->whereDate('reservation_deadline', '<', CarbonImmutable::today('Asia/Jakarta'));

        $count = 0;
        $query->chunkById(100, function ($documents) use ($dryRun, &$count) {
            foreach ($documents as $document) {
                $count++;
                if ($dryRun) continue;

                DB::transaction(function () use ($document) {
                    $document->update(['status' => 'EXPIRED', 'expired_at' => now()]);
                    $document->roomBookings()->where('status', 'PENDING')->update([
                        'status' => 'CANCELLED',
                        'cancelled_at' => now(),
                        'cancelled_by' => null,
                        'rejection_reason' => 'Kedaluwarsa',
                    ]);
                    DocumentLog::create([
                        'document_id' => $document->id,
                        'user_id' => null,
                        'action' => 'EXPIRED',
                        'note' => 'Reservasi kedaluwarsa otomatis',
                    ]);
                });
            }
        });

        return ['count' => $count, 'dry_run' => $dryRun];
    }
}
