<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingPolicyTier extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'min_days_before' => 'integer',
        'deadline_offset' => 'integer',
    ];

    public function policy()
    {
        return $this->belongsTo(BookingPolicy::class, 'booking_policy_id');
    }
}
