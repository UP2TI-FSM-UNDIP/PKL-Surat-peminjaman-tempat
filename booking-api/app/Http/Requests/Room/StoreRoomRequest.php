<?php

namespace App\Http\Requests\Room;

use App\Models\Room;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => 'required|string|max:255',
            'code'        => 'required|string|max:50|unique:rooms,code',
            'capacity'    => 'nullable|integer|min:1',
            'facilities'  => 'nullable|array',
            'status'      => 'nullable|in:ACTIVE,MAINTENANCE,INACTIVE',
            'description' => 'nullable|string',
            'images'      => 'nullable|array',
            'images.*'    => 'file|image|mimes:png,jpg,jpeg|max:5120',
            'type' => ['nullable', Rule::in(Room::TYPES)],
            'is_bookable_weekday' => 'boolean',
            'weekday_max_end_time' => 'nullable|date_format:H:i',
            'adjacent_group' => 'nullable|string|max:255',
            'adjacent_position' => 'nullable|integer|min:1',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'   => 'Nama ruangan wajib diisi',
            'name.max'        => 'Nama ruangan maksimal 255 karakter',
            'code.required'   => 'Kode ruangan wajib diisi',
            'code.unique'     => 'Kode ruangan sudah digunakan',
            'code.max'        => 'Kode ruangan maksimal 50 karakter',
            'capacity.min'    => 'Kapasitas minimal 1',
            'status.in'       => 'Status harus ACTIVE, MAINTENANCE, atau INACTIVE',
            'images.*.image'  => 'File harus berupa gambar',
            'images.*.mimes'  => 'Format gambar harus PNG, JPG, atau JPEG',
            'images.*.max'    => 'Ukuran gambar maksimal 5MB',
            'type.in' => 'Tipe ruang tidak valid',
            'weekday_max_end_time.date_format' => 'Batas akhir hari kerja harus berformat HH:mm',
            'adjacent_position.min' => 'Posisi sekat minimal 1',
        ];
    }
}
