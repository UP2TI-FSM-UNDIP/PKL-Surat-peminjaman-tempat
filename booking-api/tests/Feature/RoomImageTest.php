<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Room;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoomImageTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $slug): User
    {
        $role = Role::firstOrCreate(['slug' => $slug], ['name' => $slug]);
        $unit = Unit::firstOrCreate(['code' => 'FSM'], ['name' => 'FSM', 'category' => 'FAKULTAS']);

        return User::factory()->create([
            'role_id' => $role->id,
            'unit_id' => $unit->id,
            'is_profile_completed' => true,
        ]);
    }

    private function room(): Room
    {
        return Room::create([
            'name' => 'Ruang Uji',
            'code' => 'RUJI',
            'status' => 'ACTIVE',
        ]);
    }

    private function upload(Room $room): \Illuminate\Testing\TestResponse
    {
        return $this->post(
            "/api/rooms/{$room->id}/upload-image",
            ['image' => UploadedFile::fake()->image('room.jpg', 100, 100)],
            ['Accept' => 'application/json'],
        );
    }

    public function test_admin_can_upload_room_image(): void
    {
        Storage::fake('private');
        $room = $this->room();
        Sanctum::actingAs($this->userWithRole('admin'));

        $response = $this->upload($room);

        $response->assertOk()->assertJsonPath('success', true);
        $path = $response->json('data.path');

        $this->assertNotEmpty($path);
        Storage::disk('private')->assertExists($path);
        $this->assertContains($path, $room->fresh()->images);
    }

    public function test_room_manager_can_upload_room_image(): void
    {
        Storage::fake('private');
        $room = $this->room();
        Sanctum::actingAs($this->userWithRole('spv-sumberdaya'));

        $this->upload($room)->assertOk();
    }

    public function test_borrower_cannot_upload_room_image(): void
    {
        Storage::fake('private');
        $room = $this->room();
        Sanctum::actingAs($this->userWithRole('peminjam'));

        $this->upload($room)->assertForbidden();
    }

    public function test_upload_rejects_non_image_file(): void
    {
        Storage::fake('private');
        $room = $this->room();
        Sanctum::actingAs($this->userWithRole('admin'));

        $this->post(
            "/api/rooms/{$room->id}/upload-image",
            ['image' => UploadedFile::fake()->create('dokumen.pdf', 10, 'application/pdf')],
            ['Accept' => 'application/json'],
        )->assertStatus(422)->assertJsonValidationErrors('image');
    }

    public function test_delete_rejects_path_not_owned_by_room(): void
    {
        Storage::fake('private');
        $room = $this->room();
        Sanctum::actingAs($this->userWithRole('admin'));

        $this->deleteJson("/api/rooms/{$room->id}/images", [
            'path' => 'rooms/missing.jpg',
        ])->assertStatus(400);
    }

    public function test_image_can_be_served(): void
    {
        Storage::fake('private');
        $room = $this->room();
        Sanctum::actingAs($this->userWithRole('admin'));

        $path = $this->upload($room)->assertOk()->json('data.path');

        $this->get("/api/rooms/{$room->id}/image?path=" . urlencode($path))
            ->assertOk()
            ->assertHeader('Content-Type', 'image/jpeg');
    }

    public function test_unknown_image_path_returns_not_found(): void
    {
        Storage::fake('private');
        $room = $this->room();

        $this->getJson("/api/rooms/{$room->id}/image?path=" . urlencode('rooms/missing.jpg'))
            ->assertNotFound();
    }
}
