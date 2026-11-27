<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Services\DocumentService;
use Illuminate\Http\Request;
use App\Http\Requests\Document\ApproveDocumentRequest;
use App\Http\Requests\Document\RejectDocumentRequest;
use App\Http\Requests\Document\ReviseDocumentRequest;

class DocumentController extends Controller
{
    protected DocumentService $documentService;

    public function __construct(DocumentService $documentService)
    {
        $this->documentService = $documentService;
    }

    public function index(Request $request)
    {
        $data = $this->documentService->listDocuments($request->user(), $request->all());

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function show(Request $request, $id)
    {
        try {
            $document = $this->documentService->showDocument($id, $request->user());

            return response()->json([
                'success' => true,
                'data' => $document,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['success' => false, 'message' => 'Dokumen tidak ditemukan'], 404);
        } catch (\Exception $e) {
            $code = $e->getCode() ?: 500;
            if ($code < 100 || $code > 599) $code = 403;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $code);
        }
    }

    public function submit(Request $request, $id)
    {
        $document = Document::findByKeyOrFail($id);
        $user = $request->user();

        // Authorization: Hanya pembuat yang bisa submit
        if ($document->creator_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk submit dokumen ini',
            ], 403);
        }

        // Status check
        if (!in_array($document->status, ['DRAFT', 'REVISION'])) {
            return response()->json([
                'success' => false,
                'message' => 'Dokumen dalam status ' . $document->status . ' tidak dapat diajukan ulang',
            ], 400);
        }

        try {
            $document = $this->documentService->submitDocument($document, $user);

            return response()->json([
                'success' => true,
                'message' => ($document->status === 'APPROVED')
                    ? 'Dokumen berhasil disubmit dan disetujui secara otomatis'
                    : 'Dokumen berhasil disubmit dan diteruskan ke approver',
                'data' => $document,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Failed to submit document', ['document_id' => $id, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function approve(ApproveDocumentRequest $request, $id)
    {
        $validated = $request->validated();
        $document = Document::with(['unit', 'workflow'])->whereKeyOrPublicId($id)->firstOrFail();
        $user = $request->user();

        // Authorization: Hanya current holder
        if ($document->current_holder_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk approve dokumen ini',
            ], 403);
        }

        // Status check
        if ($document->status !== 'IN_PROGRESS') {
            return response()->json([
                'success' => false,
                'message' => 'Dokumen tidak dapat diproses',
            ], 400);
        }

        try {
            $result = $this->documentService->approveDocument($document, $user, $validated['note'] ?? null);

            return response()->json([
                'success' => true,
                'message' => $result,
                'data' => $document->fresh(['currentHolder', 'creator', 'logs']),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to approve document', ['document_id' => $id, 'error' => $e->getMessage()]);

            $code = $e->getCode() ?: 500;
            if ($code < 100 || $code > 599) $code = 500;

            return response()->json([
                'success' => false,
                'message' => ($e instanceof \Illuminate\Database\QueryException) ? 'Gagal menyetujui dokumen. Silakan coba lagi.' : $e->getMessage(),
            ], $code);
        }
    }

    public function reject(RejectDocumentRequest $request, $id)
    {
        $validated = $request->validated();
        $document = Document::findByKeyOrFail($id);
        $user = $request->user();

        // Authorization: Hanya current holder
        if ($document->current_holder_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk menolak dokumen ini',
            ], 403);
        }

        // Status check
        if ($document->status !== 'IN_PROGRESS') {
            return response()->json([
                'success' => false,
                'message' => 'Dokumen tidak dapat diproses',
            ], 400);
        }

        try {
            $result = $this->documentService->rejectDocument($document, $user, $validated['note']);

            return response()->json([
                'success' => true,
                'message' => $result,
                'data' => $document->fresh(['currentHolder', 'creator', 'logs']),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to reject document', ['document_id' => $id, 'error' => $e->getMessage()]);

            $code = $e->getCode() ?: 500;
            if ($code < 100 || $code > 599) $code = 500;

            return response()->json([
                'success' => false,
                'message' => ($e instanceof \Illuminate\Database\QueryException) ? 'Gagal menolak dokumen. Silakan coba lagi.' : $e->getMessage(),
            ], $code);
        }
    }

    public function revise(ReviseDocumentRequest $request, $id)
    {
        $validated = $request->validated();
        $document = Document::findByKeyOrFail($id);
        $user = $request->user();

        // Authorization: Hanya current holder
        if ($document->current_holder_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk mengembalikan dokumen ini',
            ], 403);
        }

        if ($document->status !== 'IN_PROGRESS') {
            return response()->json([
                'success' => false,
                'message' => 'Dokumen tidak dapat diproses',
            ], 400);
        }

        try {
            $result = $this->documentService->reviseDocument($document, $user, $validated['note']);

            return response()->json([
                'success' => true,
                'message' => $result,
                'data' => $document->fresh(['currentHolder', 'creator', 'logs']),
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to revise document', ['document_id' => $id, 'error' => $e->getMessage()]);
            $code = $e->getCode() ?: 500;
            if ($code < 100 || $code > 599) $code = 500;

            return response()->json([
                'success' => false,
                'message' => ($e instanceof \Illuminate\Database\QueryException) ? 'Gagal mengembalikan dokumen. Silakan coba lagi.' : $e->getMessage(),
            ], $code);
        }
    }

    public function file(Request $request, $id, $type)
    {
        $document = Document::findByKeyOrFail($id);
        $user = $request->user();

        if (!$this->documentService->checkDocumentAccess($document, $user)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk melihat dokumen ini',
            ], 403);
        }

        try {
            $data = $this->documentService->serveFile($document, $type);

            return response($data['content'], 200, [
                'Content-Type' => $data['mimeType'],
                'Content-Disposition' => 'inline; filename="' . $data['fileName'] . '"',
                'Cache-Control' => 'no-cache, no-store, must-revalidate',
                'Pragma' => 'no-cache',
                'Expires' => '0',
                'ETag' => $data['etag'],
            ]);
        } catch (\Exception $e) {
            $code = $e->getCode() ?: 500;
            if ($code < 100 || $code > 599) $code = 404;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $code);
        }
    }
}
