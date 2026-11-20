<?php

namespace App\Services;

use App\Models\Document;

class ProposalCompletenessService
{
    public function evaluate(Document $document): array
    {
        $content = $document->content ?? [];
        $missing = [];

        foreach (['event_name', 'event_nature', 'event_form', 'objectives', 'benefits', 'target_audience', 'ketua_pelaksana_nama', 'ketua_pelaksana_identitas', 'ketua_pelaksana_hp'] as $field) {
            if (blank($content[$field] ?? null)) {
                $missing[] = $field;
            }
        }

        if (!preg_match('/^(?:\d{10}|\d{14}|\d{18})$/', (string) ($content['ketua_pelaksana_identitas'] ?? ''))) {
            $missing[] = 'ketua_pelaksana_identitas';
        }
        if (!preg_match('/^\d{12,13}$/', (string) ($content['ketua_pelaksana_hp'] ?? ''))) {
            $missing[] = 'ketua_pelaksana_hp';
        }
        if (empty($content['slots'])) {
            $missing[] = 'slots';
        }
        if (!$document->file_proposal || !\Illuminate\Support\Facades\Storage::disk('private')->exists($document->file_proposal)) {
            $missing[] = 'file_proposal';
        }

        return ['is_complete' => count($missing) === 0, 'missing_fields' => array_values(array_unique($missing))];
    }

    public function sync(Document $document): Document
    {
        $result = $this->evaluate($document);
        $document->update([
            'proposal_completed_at' => $result['is_complete'] ? ($document->proposal_completed_at ?? now()) : null,
        ]);

        return $document->fresh();
    }
}
