<?php

namespace App\Http\Requests\Calendar;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Http\FormRequest;

class CalendarRangeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
            'room_id' => ['nullable', 'integer', 'exists:rooms,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'from.required' => 'Tanggal awal wajib diisi.',
            'from.date_format' => 'Format tanggal awal harus YYYY-MM-DD.',
            'to.required' => 'Tanggal akhir wajib diisi.',
            'to.date_format' => 'Format tanggal akhir harus YYYY-MM-DD.',
            'to.after_or_equal' => 'Tanggal akhir harus setelah atau sama dengan tanggal awal.',
            'room_id.exists' => 'Ruangan tidak ditemukan.',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($validator->errors()->hasAny(['from', 'to'])) {
                return;
            }

            $from = CarbonImmutable::parse($this->input('from'), 'Asia/Jakarta')->startOfDay();
            $to = CarbonImmutable::parse($this->input('to'), 'Asia/Jakarta')->startOfDay();

            if ($from->diffInDays($to) > 365) {
                $validator->errors()->add('to', 'Rentang tanggal maksimal 366 hari.');
            }
        });
    }
}
