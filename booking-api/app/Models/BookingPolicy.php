<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BookingPolicy extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'is_active' => 'boolean',
        'min_booking_days' => 'integer',
        'max_dates_per_room' => 'integer',
        'max_rooms_per_date' => 'integer',
        'max_total_room_hours' => 'integer',
    ];

    public function tiers(): HasMany
    {
        return $this->hasMany(BookingPolicyTier::class)->orderByDesc('min_days_before');
    }

    public function audits(): HasMany
    {
        return $this->hasMany(BookingPolicyAudit::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
