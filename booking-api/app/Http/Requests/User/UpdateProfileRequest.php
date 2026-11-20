<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Melengkapi profil sendiri (setelah login SSO pertama).
 *
 * - role_id TIDAK diterima: role hanya ditetapkan admin (atau otomatis dari SSO).
 * - unit_id TIDAK diterima: unit mengikuti data SSO/admin dan tidak diubah sendiri.
 */
class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = $this->user();

        return [
            'name' => 'required|string|max:255',
            'nim_nip' => ['required', 'string', 'max:50', Rule::unique('users', 'nim_nip')->ignore($user->id)],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama wajib diisi',
            'nim_nip.required' => 'NIM/NIP wajib diisi',
            'nim_nip.max' => 'NIM/NIP maksimal 50 karakter',
            'nim_nip.unique' => 'NIM/NIP sudah dipakai akun lain',
        ];
    }
}
