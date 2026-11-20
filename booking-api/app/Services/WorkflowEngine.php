<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentLog;
use App\Models\RoomBooking;
use App\Models\Unit;
use App\Models\User;
use App\Models\WorkflowStep;
use Illuminate\Support\Facades\DB;

class WorkflowEngine
{
    /**
     * Logika Utama: Approve & Oper ke orang berikutnya
     */
    public function approveDocument(Document $document, User $actor, $note = null)
    {
        return DB::transaction(function () use ($document, $actor, $note) {
            DocumentLog::create([
                'document_id' => $document->id,
                'user_id' => $actor->id,
                'action' => 'APPROVED',
                'note' => $note,
                'step_snapshot' => $document->current_step_order,
            ]);

            $nextStepOrder = $document->current_step_order + 1;
            $nextStep = WorkflowStep::where('workflow_id', $document->workflow_id)
                ->where('step_order', $nextStepOrder)
                ->first();

            if (!$nextStep) {
                $this->finalizeRoomBookings($document, $actor);
                $document->update([
                    'status' => 'APPROVED',
                    'completed_at' => now(),
                    'current_holder_id' => null,
                ]);

                return 'Dokumen telah disetujui sepenuhnya dan proses selesai.';
            }

            $nextUser = $this->findApprover($document, $nextStep);
            $document->update([
                'current_holder_id' => $nextUser->id,
                'current_step_order' => $nextStepOrder,
                'status' => 'IN_PROGRESS',
            ]);

            return 'Dokumen diteruskan ke: ' . $nextUser->name;
        });
    }

    /**
     * Setujui semua booking ruangan milik dokumen yang sudah disetujui penuh.
     */
    public function finalizeRoomBookings(Document $document, User $actor): void
    {
        $pending = RoomBooking::with('room')
            ->where('document_id', $document->id)
            ->where('status', 'PENDING')
            ->lockForUpdate()
            ->get();

        foreach ($pending as $booking) {
            if (!$booking->approve($actor)) {
                throw new \Exception(
                    "Ruangan {$booking->room?->name} pada " . $booking->booking_date->format('d-m-Y') .
                    ' ' . substr($booking->start_time, 0, 5) . '-' . substr($booking->end_time, 0, 5) .
                    ' sudah dipakai booking lain yang disetujui. Kembalikan dokumen untuk revisi jadwal/ruangan.',
                    400
                );
            }
        }
    }

    /**
     * Logika Reject: Tolak dokumen secara final, hentikan alur.
     */
    public function rejectDocument(Document $document, User $actor, string $note)
    {
        return DB::transaction(function () use ($document, $actor, $note) {
            DocumentLog::create([
                'document_id' => $document->id,
                'user_id' => $actor->id,
                'action' => 'REJECTED',
                'note' => $note,
                'step_snapshot' => $document->current_step_order,
            ]);

            $document->update([
                'status' => 'REJECTED',
                'completed_at' => now(),
                'current_holder_id' => null,
            ]);

            RoomBooking::where('document_id', $document->id)
                ->where('status', 'PENDING')
                ->get()
                ->each(fn (RoomBooking $booking) => $booking->reject($actor, $note));

            return 'Dokumen ditolak.';
        });
    }

    /**
     * Logika Revisi: Kembalikan dokumen ke pembuat.
     */
    public function reviseDocument(Document $document, User $actor, string $note)
    {
        return DB::transaction(function () use ($document, $actor, $note) {
            DocumentLog::create([
                'document_id' => $document->id,
                'user_id' => $actor->id,
                'action' => 'RETURNED',
                'note' => $note,
                'step_snapshot' => $document->current_step_order,
            ]);

            $document->update([
                'status' => 'REVISION',
                'current_holder_id' => $document->creator_id,
                'current_step_order' => 1,
            ]);

            return 'Dokumen dikembalikan untuk revisi.';
        });
    }

    /**
     * Cari approver di unit fakultas berdasarkan role pada step workflow.
     */
    public function findApprover(Document $doc, WorkflowStep $step)
    {
        $facultyUnit = Unit::where('category', 'FAKULTAS')->first();
        if (!$facultyUnit) {
            throw new \Exception('Unit FAKULTAS tidak ditemukan.');
        }

        $approver = User::where('unit_id', $facultyUnit->id)
            ->whereHas('role', fn ($q) => $q->where('slug', $step->target_role_slug))
            ->first();

        if (!$approver) {
            throw new \Exception("Approver '{$step->target_role_slug}' di unit fakultas tidak ditemukan.");
        }

        return $approver;
    }
}
