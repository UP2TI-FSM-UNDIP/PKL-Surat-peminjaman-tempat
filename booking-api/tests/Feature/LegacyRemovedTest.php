<?php

namespace Tests\Feature;

use App\Services\DocumentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class LegacyRemovedTest extends TestCase
{
    use RefreshDatabase;

    public function test_legacy_classes_tables_and_routes_are_gone(): void
    {
        $this->assertFalse(class_exists(\App\Services\DocumentGenerationService::class));
        $this->assertFalse(class_exists(\App\Services\DocumentTemplateService::class));
        $this->assertFalse(class_exists(\App\Models\Sign::class));
        $this->assertFalse(Schema::hasTable('signs'));
        $this->assertFalse(Schema::hasTable('document_templates'));

        $this->assertInstanceOf(DocumentService::class, app(DocumentService::class));

        $this->getJson('/api/signs')->assertNotFound();
        $this->getJson('/api/document-templates')->assertNotFound();
        $this->postJson('/api/documents/1/generate/executive-summary')->assertNotFound();
    }
}
