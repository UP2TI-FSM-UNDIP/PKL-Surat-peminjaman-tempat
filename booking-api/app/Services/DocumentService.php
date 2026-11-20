<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentLog;
use App\Models\RoomBooking;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DocumentService
{
    protected WorkflowEngine $workflowEngine;

    public function __construct(WorkflowEngine $workflowEngine)
    {
        $this->workflowEngine = $workflowEngine;
    }

    public function listDocuments(User $user, array $filters): array
    {
        $isAdmin = $user->role?->slug === 'admin';
        $perPage = $filters['per_page'] ?? 10;
        $search = $filters['q'] ?? null;

        if ($isAdmin) {
            return $this->listDocumentsForAdmin($filters, $perPage, $search);
        }

        return $this->listDocumentsForUser($user, $filters, $perPage, $search);
    }

    private function listDocumentsForAdmin(array $filters, int $perPage, ?string $search): array
    {
        $baseQuery = Document::with(['workflow', 'currentHolder', 'creator', 'unit', 'logs']);

        if (!empty($filters['workflow_id'])) {
            $baseQuery->where('workflow_id', $filters['workflow_id']);
        }
        if (!empty($filters['unit_id'])) {
            $baseQuery->where('unit_id', $filters['unit_id']);
        }

        $myQuery = clone $baseQuery;
        if (!empty($filters['status'])) {
            $myQuery->where('status', $filters['status']);
        }
        $this->applySearch($myQuery, $search);
        $myDocuments = $myQuery->latest()->paginate($perPage, ['*'], 'page_my');

        $pendingQuery = clone $baseQuery;
        $pendingQuery->whereIn('status', ['IN_PROGRESS', 'REVISION']);
        $this->applySearch($pendingQuery, $search);
        $pendingDocuments = $pendingQuery->latest()->paginate($perPage, ['*'], 'page_pending');

        $processedQuery = clone $baseQuery;
        $processedQuery->whereIn('status', ['APPROVED', 'REJECTED', 'RETURNED', 'EXPIRED', 'CANCELLED']);
        $this->applySearch($processedQuery, $search);
        $processedDocuments = $processedQuery->latest()->paginate($perPage, ['*'], 'page_processed');

        return [
            'my_documents' => $myDocuments,
            'pending_documents' => $pendingDocuments,
            'processed_documents' => $processedDocuments,
        ];
    }

    private function listDocumentsForUser(User $user, array $filters, int $perPage, ?string $search): array
    {
        $myDocumentsQuery = Document::with(['workflow', 'currentHolder.role', 'creator', 'unit', 'logs.user.unit'])
            ->where('creator_id', $user->id);

        if (!empty($filters['status'])) {
            $myDocumentsQuery->where('status', $filters['status']);
        }
        if (!empty($filters['workflow_id'])) {
            $myDocumentsQuery->where('workflow_id', $filters['workflow_id']);
        }

        $this->applySearch($myDocumentsQuery, $search);
        $myDocuments = $myDocumentsQuery->latest()->paginate($perPage, ['*'], 'page_my');

        $myDocuments->getCollection()->transform(function ($doc) {
            $doc->current_holder_info = $doc->currentHolder ? [
                'id' => $doc->currentHolder->id,
                'name' => $doc->currentHolder->name,
                'role' => $doc->currentHolder->role?->name ?? 'Unknown',
            ] : null;
            return $doc;
        });

        $pendingDocumentsQuery = Document::with(['workflow', 'creator', 'unit'])
            ->where('current_holder_id', $user->id)
            ->whereIn('status', ['IN_PROGRESS', 'REVISION']);

        if (!empty($filters['workflow_id'])) {
            $pendingDocumentsQuery->where('workflow_id', $filters['workflow_id']);
        }

        $this->applySearch($pendingDocumentsQuery, $search);
        $pendingDocuments = $pendingDocumentsQuery->latest()->paginate($perPage, ['*'], 'page_pending');

        $processedDocumentIds = DocumentLog::where('user_id', $user->id)
            ->whereIn('action', ['APPROVED', 'REJECTED', 'RETURNED'])
            ->pluck('document_id')
            ->unique();

        $processedDocumentsQuery = Document::with(['workflow', 'currentHolder', 'creator', 'unit', 'logs.user.role'])
            ->whereIn('id', $processedDocumentIds)
            ->where(function ($query) use ($user) {
                $query->where('current_holder_id', '!=', $user->id)
                      ->orWhereNull('current_holder_id');
            });

        if (!empty($filters['status'])) {
            $processedDocumentsQuery->where('status', $filters['status']);
        }
        if (!empty($filters['workflow_id'])) {
            $processedDocumentsQuery->where('workflow_id', $filters['workflow_id']);
        }

        $this->applySearch($processedDocumentsQuery, $search);
        $processedDocuments = $processedDocumentsQuery->latest()->paginate($perPage, ['*'], 'page_processed');

        return [
            'my_documents' => $myDocuments,
            'pending_documents' => $pendingDocuments,
            'processed_documents' => $processedDocuments,
        ];
    }

    private function applySearch($query, ?string $search): void
    {
        if (!$search) return;

        $search = trim($search);

        $query->where(function ($q) use ($search) {
            $q->where('id', $search)
              ->orWhere('title', 'like', "%{$search}%")
              ->orWhereHas('creator', function ($q2) use ($search) {
                  $q2->where('name', 'like', "%{$search}%");
              })
              ->orWhereHas('unit', function ($q2) use ($search) {
                  $q2->where('name', 'like', "%{$search}%");
              });
        });
    }

    public function showDocument(int $id, User $user): Document
    {
        $document = Document::with([
            'workflow.steps',
            'currentHolder.role',
            'currentHolder.unit',
            'creator.role',
            'unit',
            'logs.user.role',
            'roomBookings',
        ])->findOrFail($id);

        $isAdmin = $user->role?->slug === 'admin';
        $isCreator = $document->creator_id === $user->id;
        $isCurrentHolder = $document->current_holder_id === $user->id;

        $hasProcessed = DocumentLog::where('document_id', $document->id)
            ->where('user_id', $user->id)
            ->whereIn('action', ['APPROVED', 'REJECTED', 'SUBMITTED', 'RETURNED'])
            ->exists();

        if (!$isAdmin && !$isCreator && !$isCurrentHolder && !$hasProcessed) {
            throw new \Exception('Anda tidak memiliki akses untuk melihat dokumen ini', 403);
        }

        return $document;
    }

    public function submitDocument(Document $document, User $user): Document
    {
        DB::transaction(function () use ($document, $user) {
            $userRole = $user->role?->slug ?? '';

            // AUTO APPROVAL untuk Admin
            if ($userRole === 'admin') {
                $document->update([
                    'status' => 'APPROVED',
                    'current_step_order' => 999,
                    'current_holder_id' => null,
                    'completed_at' => now(),
                ]);

                DocumentLog::create([
                    'document_id' => $document->id,
                    'user_id' => $user->id,
                    'action' => 'APPROVED',
                    'note' => 'Dokumen disetujui secara otomatis (Manual Booking)',
                    'step_snapshot' => 999,
                ]);

                $this->workflowEngine->finalizeRoomBookings($document, $user);

                return;
            }

            $originalStatus = $document->status;
            $currentStep = 1;

            // HANDLE REVISION LOGIC
            $content = $document->content ?? [];
            if ($originalStatus === 'REVISION') {
                $previous = $document->meta_data['submitted_booking'] ?? null;

                if (!$previous) {
                    $lastBooking = RoomBooking::where('document_id', $document->id)
                        ->whereNotIn('status', ['CANCELLED', 'REJECTED'])
                        ->latest()
                        ->first();
                    $previous = $lastBooking ? [
                        'room_id' => $lastBooking->room_id,
                        'booking_date' => $lastBooking->booking_date->format('Y-m-d'),
                    ] : null;
                }

                if ($previous) {
                    $newDate = $content['booking_date'] ?? null;
                    $newRoomId = $content['room_id'] ?? null;

                    if ($newDate && $newDate !== $previous['booking_date']) {
                        \Log::info("[Revision] Date changed from {$previous['booking_date']} to {$newDate}. Restarting workflow.");
                        $currentStep = 1;
                    } elseif ($newRoomId && $newRoomId != $previous['room_id']) {
                        $sumberDayaStep = $document->workflow->steps()
                            ->where('target_role_slug', 'sumber-daya')
                            ->first();

                        if ($sumberDayaStep) {
                            \Log::info("[Revision] Room changed from {$previous['room_id']} to {$newRoomId}. Jumping to Sumber Daya (Step {$sumberDayaStep->step_order}).");
                            $currentStep = $sumberDayaStep->step_order;
                        }
                    }
                }
            }

            $this->syncBookingWithContent($document, $user);
            if (!empty($content['room_id']) && !empty($content['booking_date'])) {
                $meta = $document->meta_data ?? [];
                $meta['submitted_booking'] = [
                    'room_id' => (int) $content['room_id'],
                    'booking_date' => $content['booking_date'],
                    'start_time' => $content['start_time'] ?? null,
                    'end_time' => $content['end_time'] ?? null,
                ];
                $document->update(['meta_data' => $meta]);
            }

            $firstStep = $document->workflow->steps()->where('step_order', $currentStep)->first();

            if (!$firstStep) {
                throw new \Exception("Workflow tidak memiliki langkah ke-{$currentStep}");
            }

            $logNote = $originalStatus === 'REVISION'
                ? 'Dokumen diajukan ulang setelah revisi'
                : 'Dokumen diajukan untuk diproses';

            DocumentLog::create([
                'document_id' => $document->id,
                'user_id' => $user->id,
                'action' => 'SUBMITTED',
                'note' => $logNote,
                'step_snapshot' => $originalStatus === 'REVISION' ? $currentStep : 0,
            ]);

            // AUTO-APPROVE JIKA SUBMITTER ADALAH SEKRETARIS (legacy, tetap ada sampai Task 10)
            if ($currentStep === 1 && $userRole === 'sekretaris' && $firstStep->target_role_slug === 'sekretaris') {
                DocumentLog::create([
                    'document_id' => $document->id,
                    'user_id' => $user->id,
                    'action' => 'APPROVED',
                    'note' => 'Pengajuan oleh Sekretaris (auto-approve)',
                    'step_snapshot' => 1,
                ]);

                $secondStep = $document->workflow->steps()->where('step_order', 2)->first();

                if (!$secondStep) {
                    $this->workflowEngine->finalizeRoomBookings($document, $user);
                    $document->update([
                        'status' => 'APPROVED',
                        'completed_at' => now(),
                        'current_holder_id' => null,
                        'current_step_order' => 1,
                    ]);
                    return;
                }

                $secondApprover = $this->workflowEngine->findApprover($document, $secondStep);

                if (!$secondApprover) {
                    throw new \Exception("Tidak dapat menemukan approver untuk langkah '{$secondStep->step_name}'.");
                }

                $document->update([
                    'status' => 'IN_PROGRESS',
                    'current_step_order' => 2,
                    'current_holder_id' => $secondApprover->id,
                ]);

                return;
            }

            $approver = $this->workflowEngine->findApprover($document, $firstStep);

            if (!$approver) {
                $roleName = $firstStep->target_role_slug;
                $unitName = $document->unit->name ?? 'Unknown Unit';

                throw new \Exception("Tidak dapat menemukan approver untuk langkah '{$firstStep->step_name}'. Diperlukan user dengan role '{$roleName}' di unit '{$unitName}'.");
            }

            $document->update([
                'status' => 'IN_PROGRESS',
                'current_step_order' => $currentStep,
                'current_holder_id' => $approver->id,
            ]);
        });

        return $document->fresh(['currentHolder', 'creator', 'logs']);
    }

    /**
     * Samakan booking ruangan (PENDING) dengan jadwal di content dokumen.
     * Dipertahankan sementara sampai alur submit lama diganti pada Task 10.
     */
    private function syncBookingWithContent(Document $document, User $user): void
    {
        $content = $document->content ?? [];
        if (empty($content['room_id']) || empty($content['booking_date'])
            || empty($content['start_time']) || empty($content['end_time'])) {
            return;
        }

        $bookings = RoomBooking::where('document_id', $document->id)
            ->where('status', '!=', 'REJECTED')
            ->latest('id')
            ->get();

        if ($bookings->count() > 1) {
            return;
        }

        $booking = $bookings->first();
        $target = [
            'room_id' => (int) $content['room_id'],
            'booking_date' => $content['booking_date'],
            'start_time' => substr($content['start_time'], 0, 5),
            'end_time' => substr($content['end_time'], 0, 5),
        ];

        if ($booking && in_array($booking->status, ['APPROVED', 'COMPLETED'])) {
            return;
        }

        $alreadyInSync = $booking
            && $booking->status === 'PENDING'
            && (int) $booking->room_id === $target['room_id']
            && $booking->booking_date->format('Y-m-d') === $target['booking_date']
            && substr($booking->start_time, 0, 5) === $target['start_time']
            && substr($booking->end_time, 0, 5) === $target['end_time'];

        if ($alreadyInSync) {
            return;
        }

        app(RoomBookingService::class)->validateScheduleRules(
            $target['booking_date'], $target['start_time'], $target['end_time']
        );

        $room = \App\Models\Room::find($target['room_id']);
        if (!$room) {
            throw new \Exception('Ruangan yang dipilih tidak ditemukan', 400);
        }
        if (!$room->isAvailable($target['booking_date'], $target['start_time'], $target['end_time'], $booking?->id, $document->id)) {
            throw new \Exception('Ruangan tidak tersedia pada jadwal yang dipilih. Silakan pilih jadwal/ruangan lain.', 400);
        }

        if ($booking) {
            $booking->update($target + ['status' => 'PENDING', 'rejection_reason' => null]);
            return;
        }

        RoomBooking::create($target + [
            'document_id' => $document->id,
            'booked_by' => $document->creator_id,
            'purpose' => $content['event_name'] ?? ($content['purpose'] ?? $document->title),
            'status' => 'PENDING',
        ]);
    }

    public function approveDocument(Document $document, User $user, ?string $note): string
    {
        return $this->workflowEngine->approveDocument($document, $user, $note);
    }

    public function reviseDocument(Document $document, User $user, int $targetUserId, string $note): string
    {
        return $this->workflowEngine->reviseDocument($document, $user, $targetUserId, $note);
    }

    public function rejectDocument(Document $document, User $user, string $note): string
    {
        return $this->workflowEngine->rejectDocument($document, $user, $note);
    }

    public function checkDocumentAccess(Document $document, User $user): bool
    {
        $isAdmin = $user->role?->slug === 'admin';
        $isCreator = $document->creator_id === $user->id;
        $isCurrentHolder = $document->current_holder_id === $user->id;

        $hasProcessed = DocumentLog::where('document_id', $document->id)
            ->where('user_id', $user->id)
            ->whereIn('action', ['APPROVED', 'REJECTED', 'SUBMITTED', 'RETURNED'])
            ->exists();

        return $isAdmin || $isCreator || $isCurrentHolder || $hasProcessed;
    }

    public function serveFile(Document $document, string $type): array
    {
        if ($type !== 'proposal' || !$document->file_proposal) {
            throw new \Exception('File tidak ditemukan', 404);
        }

        $disk = Storage::disk('private');
        if (!$disk->exists($document->file_proposal)) {
            throw new \Exception('File proposal tidak ditemukan', 404);
        }

        $content = $disk->get($document->file_proposal);

        return [
            'content' => $content,
            'mimeType' => 'application/pdf',
            'fileName' => basename($document->file_proposal),
            'etag' => md5($content),
        ];
    }
}
