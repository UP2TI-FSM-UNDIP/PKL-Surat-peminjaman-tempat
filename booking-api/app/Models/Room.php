<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    use HasFactory, SoftDeletes;

    public const TYPES = [
        'KELAS',
        'SIDANG',
        'PENDOPO',
        'STUDIO',
        'LAB',
        'AULA',
        'LAINNYA',
    ];

    protected $fillable = [
        'name',
        'code',
        'capacity',
        'facilities',
        'status',
        'description',
        'images',
        'type',
        'is_bookable_weekday',
        'weekday_max_end_time',
        'adjacent_group',
        'adjacent_position',
    ];

    protected $casts = [
        'facilities' => 'array',
        'images' => 'array',
        'capacity' => 'integer',
        'is_bookable_weekday' => 'boolean',
        'adjacent_position' => 'integer',
        'weekday_seeded_at' => 'datetime',
    ];

    protected $hidden = [
        'weekday_seeded_at',
    ];

    protected function weekdayMaxEndTime(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? substr($value, 0, 5) : null,
        );
    }

    /**
     * Semua booking untuk ruangan ini
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(RoomBooking::class);
    }

    /**
     * Booking aktif (APPROVED dan belum COMPLETED)
     */
    public function activeBookings(): HasMany
    {
        return $this->hasMany(RoomBooking::class)
                    ->whereIn('status', ['APPROVED', 'PENDING']);
    }

    /**
     * Cek apakah ruangan tersedia pada waktu tertentu berdasarkan room_bookings.
     */
    public function isAvailable(
        string $date,
        string $startTime,
        string $endTime,
        ?int $excludeBookingId = null,
        ?int $excludeDocumentId = null
    ): bool {
        $startTime = strlen($startTime) === 5 ? $startTime . ':00' : $startTime;
        $endTime = strlen($endTime) === 5 ? $endTime . ':00' : $endTime;

        $query = $this->bookings()
            ->whereDate('booking_date', $date)
            ->whereIn('status', ['PENDING', 'APPROVED', 'COMPLETED'])
            ->where('start_time', '<', $endTime)
            ->where('end_time', '>', $startTime);

        if ($excludeBookingId) {
            $query->where('id', '!=', $excludeBookingId);
        }
        if ($excludeDocumentId) {
            $query->where('document_id', '!=', $excludeDocumentId);
        }

        return !$query->exists();
    }

    /**
     * Scope untuk ruangan yang aktif
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }

    // NOTE: scopeByUnit removed — rooms table has no unit_id column
}
