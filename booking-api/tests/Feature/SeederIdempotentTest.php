<?php

namespace Tests\Feature;

use App\Models\BookingPolicy;
use App\Models\Role;
use App\Models\Workflow;
use Database\Seeders\BookingPolicySeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\UnitSeeder;
use Database\Seeders\WorkflowSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeederIdempotentTest extends TestCase
{
    use RefreshDatabase;

    public function test_role_and_workflow_seeders_are_idempotent(): void
    {
        $this->seed([RoleSeeder::class, UnitSeeder::class, BookingPolicySeeder::class, WorkflowSeeder::class]);
        $this->seed([RoleSeeder::class, UnitSeeder::class, BookingPolicySeeder::class, WorkflowSeeder::class]);

        $this->assertSame(6, Role::count());
        $this->assertSame(1, Workflow::count());
        $this->assertSame(1, BookingPolicy::where('is_active', true)->count());
        $this->assertSame(3, Workflow::first()->steps()->count());
    }
}
