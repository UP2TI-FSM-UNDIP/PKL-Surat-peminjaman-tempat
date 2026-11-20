<?php

namespace App\Http\Requests\Document;

use Illuminate\Foundation\Http\FormRequest;

class ReviseDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'note' => 'required|string',
        ];
    }

    public function messages(): array
    {
        return [
            'note.required' => 'Catatan revisi wajib diisi',
        ];
    }
}
