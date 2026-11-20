<?php

namespace Database\Seeders;

use App\Models\Workflow;
use App\Models\WorkflowStep;
use Illuminate\Database\Seeder;

class WorkflowSeeder extends Seeder
{
    public function run(): void
    {
        $workflow = Workflow::updateOrCreate(
            ['name' => 'Peminjaman Ruang Umum'],
            [
                'description' => 'Alur persetujuan peminjaman ruang untuk mahasiswa dan dosen.',
                'applies_to_category' => 'UMUM',
            ]
        );

        $steps = [
            ['step_order' => 1, 'step_name' => 'Verifikasi Supervisor Sumberdaya', 'target_role_slug' => 'spv-sumberdaya'],
            ['step_order' => 2, 'step_name' => 'Persetujuan Manajer Tata Usaha', 'target_role_slug' => 'manajer-tata-usaha'],
            ['step_order' => 3, 'step_name' => 'Persetujuan Wakil Dekan II', 'target_role_slug' => 'wadek2'],
        ];

        foreach ($steps as $step) {
            WorkflowStep::updateOrCreate(
                ['workflow_id' => $workflow->id, 'step_order' => $step['step_order']],
                $step + ['workflow_id' => $workflow->id, 'scope_type' => 'FACULTY_LEADER', 'target_category_lookup' => null]
            );
        }

        $workflow->steps()->where('step_order', '>', 3)->delete();
    }
}
