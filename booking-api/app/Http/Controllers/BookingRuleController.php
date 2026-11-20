<?php

namespace App\Http\Controllers;

use App\Services\BookingRuleService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;

class BookingRuleController extends Controller
{
    public function show(Request $request, BookingRuleService $service)
    {
        $date = CarbonImmutable::parse($request->query('date', 'today'), 'Asia/Jakarta');

        return response()->json(['success' => true, 'data' => $service->rulesForDate($date)]);
    }
}
