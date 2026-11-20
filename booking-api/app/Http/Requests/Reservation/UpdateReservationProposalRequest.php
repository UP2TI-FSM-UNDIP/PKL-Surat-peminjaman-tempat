<?php

namespace App\Http\Requests\Reservation;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReservationProposalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'content' => 'nullable|array',
            'content.equipment_items' => 'nullable|array',
            'content.equipment_items.*.nama' => 'required_with:content.equipment_items|string|max:255',
            'content.equipment_items.*.jumlah' => 'required_with:content.equipment_items|integer|min:1',
            'proposal' => 'nullable|file|mimes:pdf|max:20480',
        ];
    }
}
