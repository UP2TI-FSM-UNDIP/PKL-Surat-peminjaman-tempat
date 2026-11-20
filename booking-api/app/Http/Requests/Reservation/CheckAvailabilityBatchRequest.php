<?php

namespace App\Http\Requests\Reservation;

use Illuminate\Foundation\Http\FormRequest;

class CheckAvailabilityBatchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slots' => 'required|array|min:1',
            'slots.*.room_id' => 'required|exists:rooms,id',
            'slots.*.booking_date' => 'required|date_format:Y-m-d',
            'slots.*.start_time' => 'required|date_format:H:i',
            'slots.*.end_time' => 'required|date_format:H:i',
            'exclude_document_id' => 'nullable|exists:documents,id',
        ];
    }
}
