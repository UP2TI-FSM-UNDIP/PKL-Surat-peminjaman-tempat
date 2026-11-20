<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBookingPolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'min_booking_days' => 'required|integer|min:1',
            'max_dates_per_room' => 'required|integer|min:1',
            'max_rooms_per_date' => 'required|integer|min:1',
            'max_total_room_hours' => 'nullable|integer|min:1',
            'tiers' => 'required|array|min:1',
            'tiers.*.min_days_before' => 'required|integer|min:1',
            'tiers.*.deadline_offset' => 'required|integer|min:1',
            'tiers.*.label' => 'nullable|string|max:255',
        ];
    }
}
