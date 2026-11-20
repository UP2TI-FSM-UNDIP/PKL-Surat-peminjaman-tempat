<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class RecalculateBookingPolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'dry_run' => 'boolean',
            'policy_id' => 'nullable|exists:booking_policies,id',
        ];
    }
}
