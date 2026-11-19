<?php

namespace App\Http\Requests\Room;

use App\Models\Room;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'name'        => 'sometimes|required|string|max:255',
            'code'        => 'sometimes|required|string|max:50|unique:rooms,code,' . $id,
            'capacity'    => 'nullable|integer|min:1',
            'facilities'  => 'nullable|array',
            'description' => 'nullable|string',
            'status'      => 'nullable|in:ACTIVE,MAINTENANCE,INACTIVE',
            'images.*'    => 'nullable|string',
            'type' => ['sometimes', 'nullable', Rule::in(Room::TYPES)],
            'is_bookable_weekday' => ['sometimes', 'boolean'],
            'weekday_max_end_time' => ['sometimes', 'nullable', 'date_format:H:i'],
            'adjacent_group' => ['sometimes', 'nullable', 'string', 'max:255'],
            'adjacent_position' => ['sometimes', 'nullable', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.max'     => 'Nama ruangan maksimal 255 karakter',
            'code.unique'  => 'Kode ruangan sudah digunakan',
            'code.max'     => 'Kode ruangan maksimal 50 karakter',
            'capacity.min' => 'Kapasitas minimal 1',
            'status.in'    => 'Status harus ACTIVE, MAINTENANCE, atau INACTIVE',
            'type.in' => 'Tipe ruang tidak valid',
            'weekday_max_end_time.date_format' => 'Batas akhir hari kerja harus berformat HH:mm',
            'adjacent_position.min' => 'Posisi sekat minimal 1',
        ];
    }
}
