<?php

namespace App\Http\Requests\Reservation;

use Illuminate\Foundation\Http\FormRequest;

class StoreReservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'mode' => 'required|in:one_room_many_dates,one_date_many_rooms',
            'slots' => 'required|array|min:1',
            'slots.*.room_id' => 'required|exists:rooms,id',
            'slots.*.booking_date' => 'required|date_format:Y-m-d',
            'slots.*.start_time' => 'required|date_format:H:i',
            'slots.*.end_time' => 'required|date_format:H:i',
            'purpose' => 'required|string|max:255',
            'ketua_pelaksana_nama' => 'required|string|max:255',
            'ketua_pelaksana_identitas' => ['required', 'regex:/^(?:\d{10}|\d{14}|\d{18})$/'],
            'ketua_pelaksana_hp' => 'required|regex:/^\d{12,13}$/',
            'expected_participants' => 'nullable|integer|min:1',
            'buka_sekat' => 'boolean',
            'intent' => 'required|in:reservation,submit',
        ];
    }
}
