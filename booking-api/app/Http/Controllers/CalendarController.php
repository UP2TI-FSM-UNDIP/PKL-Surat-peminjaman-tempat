<?php

namespace App\Http\Controllers;

use App\Http\Requests\Calendar\CalendarRangeRequest;
use App\Services\CalendarService;

class CalendarController extends Controller
{
    public function index(CalendarRangeRequest $request, CalendarService $service)
    {
        return response()->json([
            'success' => true,
            'data' => $service->forRange(
                $request->validated('from'),
                $request->validated('to'),
                $request->validated('room_id'),
            ),
        ]);
    }
}
