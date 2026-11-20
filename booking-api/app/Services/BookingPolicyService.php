<?php

namespace App\Services;

use App\Models\BookingPolicy;
use App\Models\BookingPolicyAudit;
use App\Models\Document;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingPolicyService
{
    public function active(): BookingPolicy
    {
        return Cache::remember('booking_policy_active', 300, function () {
            return BookingPolicy::with('tiers')->where('is_active', true)->latest('id')->firstOrFail();
        });
    }

    public function computeDeadline(CarbonImmutable $applicationDate, CarbonImmutable $earliestSlotDate): array
    {
        return $this->computeDeadlineForPolicy($this->active(), $applicationDate, $earliestSlotDate);
    }

    public function computeDeadlineForPolicy(BookingPolicy $policy, CarbonImmutable $applicationDate, CarbonImmutable $earliestSlotDate): array
    {
        $daysBefore = (int) $applicationDate->diffInDays($earliestSlotDate);

        $tier = $policy->tiers->first(fn ($tier) => $daysBefore >= $tier->min_days_before);
        if (!$tier) {
            throw ValidationException::withMessages([
                'slots' => ['Tidak ada tier deadline yang cocok untuk tanggal reservasi ini.'],
            ]);
        }

        $deadline = $earliestSlotDate->subDays($tier->deadline_offset);

        return [
            'policy_id' => $policy->id,
            'strategy' => 'tiered',
            'application_date' => $applicationDate->toDateString(),
            'earliest_slot_date' => $earliestSlotDate->toDateString(),
            'days_before' => $daysBefore,
            'matched_min_days' => $tier->min_days_before,
            'deadline_offset' => $tier->deadline_offset,
            'computed_deadline' => $deadline->toDateString(),
            'min_booking_days' => $policy->min_booking_days,
            'max_dates_per_room' => $policy->max_dates_per_room,
            'max_rooms_per_date' => $policy->max_rooms_per_date,
            'max_total_room_hours' => $policy->max_total_room_hours,
        ];
    }

    public function validatePayload(array $data): array
    {
        $tiers = collect($data['tiers'] ?? [])->sortByDesc('min_days_before')->values();
        $errors = [];

        if ($tiers->isEmpty()) {
            $errors['tiers'][] = 'Minimal satu tier.';
        }

        if ($tiers->pluck('min_days_before')->duplicates()->isNotEmpty()) {
            $errors['tiers'][] = 'Threshold tier tidak boleh duplikat.';
        }

        if ($tiers->isNotEmpty() && (int) $tiers->last()['min_days_before'] !== (int) $data['min_booking_days']) {
            $errors['tiers'][] = 'Baris terakhir harus sama dengan min_booking_days.';
        }

        foreach ($tiers as $tier) {
            $offset = (int) $tier['deadline_offset'];
            $threshold = (int) $tier['min_days_before'];
            if ($offset < 1 || $offset > $threshold) {
                $errors['tiers'][] = 'deadline_offset harus 1..min_days_before.';
            }
        }

        if ((int) $data['min_booking_days'] < 1) {
            $errors['min_booking_days'][] = 'min_booking_days minimal 1.';
        }
        if ((int) $data['max_dates_per_room'] < 1) {
            $errors['max_dates_per_room'][] = 'max_dates_per_room minimal 1.';
        }
        if ((int) $data['max_rooms_per_date'] < 1) {
            $errors['max_rooms_per_date'][] = 'max_rooms_per_date minimal 1.';
        }
        if (($data['max_total_room_hours'] ?? null) !== null && (int) $data['max_total_room_hours'] < 1) {
            $errors['max_total_room_hours'][] = 'max_total_room_hours minimal 1 atau null.';
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }

        return $data + ['tiers' => $tiers->all()];
    }

    public function save(array $data, User $actor): BookingPolicy
    {
        $data = $this->validatePayload($data);

        return DB::transaction(function () use ($data, $actor) {
            $old = BookingPolicy::where('is_active', true)->with('tiers')->latest('id')->first();

            BookingPolicy::where('is_active', true)->update(['is_active' => false]);

            $policy = BookingPolicy::create([
                'name' => $data['name'],
                'min_booking_days' => $data['min_booking_days'],
                'max_dates_per_room' => $data['max_dates_per_room'],
                'max_rooms_per_date' => $data['max_rooms_per_date'],
                'max_total_room_hours' => $data['max_total_room_hours'] ?? null,
                'is_active' => true,
                'created_by' => $actor->id,
            ]);

            $policy->tiers()->createMany($data['tiers']);

            BookingPolicyAudit::create([
                'booking_policy_id' => $policy->id,
                'user_id' => $actor->id,
                'action' => $old ? 'UPDATED' : 'CREATED',
                'before_json' => $old?->toArray(),
                'after_json' => $policy->load('tiers')->toArray(),
            ]);

            Cache::forget('booking_policy_active');

            return $policy->load('tiers');
        });
    }

    public function preview(array $data, ?string $date = null): array
    {
        try {
            $data = $this->validatePayload($data);
        } catch (ValidationException $e) {
            return ['valid' => false, 'warnings' => $e->errors(), 'preview' => []];
        }

        $tiers = collect($data['tiers'])->sortByDesc('min_days_before')->values();
        $h = $date ? CarbonImmutable::parse($date, 'Asia/Jakarta') : CarbonImmutable::today('Asia/Jakarta')->addDays(30);

        $preview = [];
        for ($hMinus = 30; $hMinus >= 1; $hMinus--) {
            $application = $h->subDays($hMinus);
            $tier = $tiers->first(fn ($tier) => $hMinus >= $tier['min_days_before']);
            $preview[] = [
                'h_minus' => $hMinus,
                'application_date' => $application->toDateString(),
                'matched_min_days' => $tier['min_days_before'] ?? null,
                'deadline_offset' => $tier['deadline_offset'] ?? null,
                'deadline' => $tier ? $h->subDays($tier['deadline_offset'])->toDateString() : null,
            ];
        }

        return ['valid' => true, 'warnings' => [], 'preview' => $preview];
    }

    public function recalculate(bool $dryRun, ?int $policyId, User $actor): array
    {
        $policy = $policyId ? BookingPolicy::with('tiers')->findOrFail($policyId) : $this->active();
        $affected = [];

        Document::whereIn('status', ['DRAFT', 'REVISION'])->chunkById(100, function ($documents) use ($policy, $dryRun, $actor, &$affected) {
            foreach ($documents as $document) {
                $content = $document->content ?? [];
                $slots = $content['slots'] ?? [];
                if (!$slots) {
                    continue;
                }

                $earliest = collect($slots)->min('booking_date');
                $computed = $this->computeDeadlineForPolicy(
                    $policy,
                    $document->created_at->toImmutable()->setTimezone('Asia/Jakarta'),
                    CarbonImmutable::parse($earliest, 'Asia/Jakarta')
                );

                $affected[] = ['document_id' => $document->id, 'deadline' => $computed['computed_deadline']];

                if (!$dryRun) {
                    $document->update([
                        'reservation_deadline' => $computed['computed_deadline'],
                        'deadline_policy_id' => $computed['policy_id'],
                        'deadline_rule_snapshot' => $computed,
                    ]);
                }
            }
        });

        if (!$dryRun) {
            BookingPolicyAudit::create([
                'booking_policy_id' => $policy->id,
                'user_id' => $actor->id,
                'action' => 'RECALCULATED',
                'before_json' => null,
                'after_json' => ['affected' => $affected],
            ]);
            Cache::forget('booking_policy_active');
        }

        return ['affected' => $affected, 'count' => count($affected), 'dry_run' => $dryRun];
    }
}
