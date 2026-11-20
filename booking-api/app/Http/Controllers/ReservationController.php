<?php

namespace App\Http\Controllers;

use App\Services\ReservationService;
use Illuminate\Http\Request;
use App\Http\Requests\Reservation\StoreReservationRequest;
use App\Http\Requests\Reservation\CheckAvailabilityBatchRequest;

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
}
