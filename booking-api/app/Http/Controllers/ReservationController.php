<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Services\DocumentService;
use App\Services\ReservationService;
use Illuminate\Http\Request;
use App\Http\Requests\Reservation\StoreReservationRequest;
use App\Http\Requests\Reservation\CheckAvailabilityBatchRequest;
use App\Http\Requests\Reservation\UpdateReservationProposalRequest;
use App\Http\Requests\Reservation\CancelReservationRequest;

class ReservationController extends Controller
{
    public function store(StoreReservationRequest $request, ReservationService $service)
    {
        abort_if(!in_array($request->user()->role?->slug, ['peminjam', 'dosen', 'admin'], true), 403);

        $document = $service->create($request->user(), $request->validated());

        return response()->json(['success' => true, 'message' => 'Reservasi dibuat', 'data' => $document], 201);
    }

    public function checkAvailability(CheckAvailabilityBatchRequest $request, ReservationService $service)
    {
        return response()->json([
            'success' => true,
            'data' => $service->checkAvailability($request->validated()['slots'], $request->input('exclude_document_id')),
        ]);
    }

    public function updateProposal(UpdateReservationProposalRequest $request, Document $document, ReservationService $service)
    {
        $this->assertCanManage($request, $document);

        $data = $request->validated();
        $data['content'] = $request->input('content', []);

        $document = $service->updateProposal(
            $document,
            $request->user(),
            $data,
            $request->file('proposal')
        );

        return response()->json(['success' => true, 'message' => 'Proposal diperbarui', 'data' => $document]);
    }

    public function cancel(CancelReservationRequest $request, Document $document, ReservationService $service)
    {
        $this->assertCanManage($request, $document);

        $document = $service->cancel($document, $request->user(), $request->input('reason'));

        return response()->json(['success' => true, 'message' => 'Reservasi dibatalkan', 'data' => $document]);
    }

    public function summary(Request $request, Document $document, ReservationService $service)
    {
        abort_if(
            !app(DocumentService::class)->checkDocumentAccess($document, $request->user()),
            403
        );

        return response()->json(['success' => true, 'data' => $service->summary($document)]);
    }

    private function assertCanManage(Request $request, Document $document): void
    {
        abort_if(
            $request->user()->id !== $document->creator_id && !$request->user()->isAdmin(),
            403
        );
    }
}
