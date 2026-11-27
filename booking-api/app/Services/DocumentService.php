<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

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
            return $this->listDocumentsForAdmin($user, $filters, $perPage, $search);
        }

        return $this->listDocumentsForUser($user, $filters, $perPage, $search);
    }

    private function listDocumentsForAdmin(User $user, array $filters, int $perPage, ?string $search): array
    {
        $baseQuery = Document::with(['workflow', 'currentHolder', 'creator', 'unit', 'logs']);

        if (!empty($filters['workflow_id'])) {
            $baseQuery->where('workflow_id', $filters['workflow_id']);
        }
        if (!empty($filters['unit_id'])) {
            $baseQuery->where('unit_id', $filters['unit_id']);
        }

        $myQuery = clone $baseQuery;
        // `mine=1`: halaman "Pengajuan saya" admin hanya menampilkan dokumen buatannya sendiri.
        if (filter_var($filters['mine'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $myQuery->where('creator_id', $user->id);
        }
        if (!empty($filters['status'])) {
            $myQuery->whereIn('status', $this->statusFilter($filters['status']));
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
            $myDocumentsQuery->whereIn('status', $this->statusFilter($filters['status']));
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
            $processedDocumentsQuery->whereIn('status', $this->statusFilter($filters['status']));
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

    public function showDocument(int|string $id, User $user): Document
    {
        $document = Document::with([
            'workflow.steps',
            'currentHolder.role',
            'currentHolder.unit',
            'creator.role',
            'unit',
            'logs.user.role',
            'roomBookings',
        ])->whereKeyOrPublicId($id)->firstOrFail();

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
        if ($user->isAdmin()) {
            $document->update(['status' => 'APPROVED', 'completed_at' => now(), 'current_holder_id' => null]);
            $document->roomBookings()->where('status', 'PENDING')->update(['status' => 'APPROVED', 'approved_by' => $user->id, 'approved_at' => now()]);
            DocumentLog::create(['document_id' => $document->id, 'user_id' => $user->id, 'action' => 'APPROVED', 'note' => 'Manual booking oleh admin']);

            return $document->fresh(['roomBookings', 'logs']);
        }

        if ($document->reservation_deadline && $document->reservation_deadline->lt(today('Asia/Jakarta'))) {
            throw ValidationException::withMessages(['reservation_deadline' => ['Reservasi sudah melewati deadline.']]);
        }

        $completeness = app(ProposalCompletenessService::class)->evaluate($document);
        if (!$completeness['is_complete']) {
            throw ValidationException::withMessages(['proposal' => ['Proposal belum lengkap.'], 'missing' => $completeness['missing_fields']]);
        }

        $conflicts = app(ReservationService::class)->checkAvailability(
            ($document->content['slots'] ?? []),
            $document->id
        );
        if (!$conflicts['available']) {
            throw ValidationException::withMessages(['slots' => ['Slot bentrok.']]);
        }

        $document->workflow->steps()->where('step_order', 1)->firstOrFail();

        DB::transaction(function () use ($document, $user) {
            $document->update([
                'status' => 'IN_PROGRESS',
                'current_step_order' => 1,
                'proposal_completed_at' => $document->proposal_completed_at ?? now(),
            ]);

            DocumentLog::create(['document_id' => $document->id, 'user_id' => $user->id, 'action' => 'SUBMITTED', 'note' => 'Dokumen diajukan']);

            // Tahap pertama; tahap milik pengaju sendiri dilewati otomatis.
            $this->workflowEngine->routeToStep($document, 1, $user);
        });

        return $document->fresh(['currentHolder', 'roomBookings']);
    }

    public function approveDocument(Document $document, User $user, ?string $note): string
    {
        return $this->workflowEngine->approveDocument($document, $user, $note);
    }

    public function reviseDocument(Document $document, User $user, string $note): string
    {
        return $this->workflowEngine->reviseDocument($document, $user, $note);
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

    /** Filter status boleh berisi beberapa nilai dipisah koma, mis. "DRAFT,REVISION". */
    private function statusFilter(string|array $status): array
    {
        $values = is_array($status) ? $status : explode(',', $status);

        return array_values(array_filter(array_map(fn ($v) => strtoupper(trim((string) $v)), $values)));
    }
}
