<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Admin
use App\Http\Controllers\Admin\AdminUserController;

use App\Http\Controllers\WorkflowController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\RoomBookingController;

// Get authenticated user
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    $user = $request->user();
    $user->load(['role', 'unit']);
    return $user;
});
Route::middleware('auth:sanctum')->patch('/user/profile', [App\Http\Controllers\UserController::class, 'updateProfile']);

// DEV ONLY: Get all users for development login menu
// Hanya bisa diakses di environment local/development
if (app()->environment('local', 'development')) {
    Route::get('/dev/users', function () {
        return \App\Models\User::with(['role', 'unit'])
            ->select('id', 'name', 'email', 'role_id', 'unit_id')
            ->orderBy('role_id')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role?->name ?? 'Unknown',
                    'unit' => $user->unit?->name ?? 'Unknown',
                ];
            });
    });
}

// Public: verifikasi bukti peminjaman dari QR code (butuh token di URL)
Route::get('/room-bookings/{id}/verify', [RoomBookingController::class, 'verify'])
    ->whereNumber('id')
    ->middleware('throttle:30,1');

// Public Room Image Route (Accessed by <img> tags)
Route::get('/rooms/{id}/image', 'App\Http\Controllers\RoomController@serveImage')->name('api.rooms.image');

// Routes yang membutuhkan autentikasi + role sudah ditetapkan admin
// (akun "Menunggu Penetapan" hanya boleh GET /user, PATCH /user/profile, GET /units)
Route::middleware(['auth:sanctum', 'role.assigned'])->group(function () {

    // =============================================
    // ADMIN-ONLY ROUTES
    // =============================================
    // Admin selalu diizinkan; role lain disebut eksplisit sesuai tugasnya.

    // Admin Dashboard
    Route::middleware('admin')->prefix('admin/dashboard')->group(function () {
        Route::get('/stats', [App\Http\Controllers\Admin\DashboardController::class, 'stats']);
    });

    // Booking Policy (versi aktif + audit)
    Route::middleware('admin')->prefix('admin/booking-policy')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\BookingPolicyController::class, 'show']);
        Route::put('/', [\App\Http\Controllers\Admin\BookingPolicyController::class, 'update']);
        Route::post('/preview', [\App\Http\Controllers\Admin\BookingPolicyController::class, 'preview']);
        Route::get('/audits', [\App\Http\Controllers\Admin\BookingPolicyController::class, 'audits']);
        Route::post('/recalculate', [\App\Http\Controllers\Admin\BookingPolicyController::class, 'recalculate']);
    });

    // Room Management (Create, Update, Delete, Upload Image) — empat role pengelola
    Route::middleware('admin:wadek2,manajer-tata-usaha,spv-sumberdaya')->prefix('rooms')->group(function () {
        Route::post('/', [RoomController::class, 'store']);
        Route::put('/{id}', [RoomController::class, 'update']);
        Route::delete('/{id}', [RoomController::class, 'destroy']);
        Route::post('/{id}/upload-image', [RoomController::class, 'uploadImage']);
        Route::delete('/{id}/images', [RoomController::class, 'deleteImage']);
    });

    // =============================================
    // AUTHENTICATED USER ROUTES
    // =============================================

    // Workflow Routes
    Route::prefix('workflows')->group(function () {
        Route::get('/', [WorkflowController::class, 'index']);
        Route::get('/{id}', [WorkflowController::class, 'show']);
        Route::put('/{id}', [WorkflowController::class, 'update']);      // Has internal admin check

        // Workflow Steps Management
        Route::post('/{id}/steps', [WorkflowController::class, 'addStep']);
        Route::put('/{workflowId}/steps/{stepId}', [WorkflowController::class, 'updateStep']);
        Route::delete('/{workflowId}/steps/{stepId}', [WorkflowController::class, 'deleteStep']);
    });

    // Document Routes
    Route::prefix('documents')->group(function () {
        Route::get('/', [DocumentController::class, 'index']);
        Route::get('/{id}', [DocumentController::class, 'show']);

        // Workflow Actions
        Route::post('/{id}/submit', [DocumentController::class, 'submit']);
        Route::post('/{id}/approve', [DocumentController::class, 'approve']);
        Route::post('/{id}/reject', [DocumentController::class, 'reject']);
        Route::post('/{id}/revise', [DocumentController::class, 'revise']);

        // Serve proposal file
        Route::get('/{id}/file/{type}', [DocumentController::class, 'file'])->name('api.documents.file');
    });

    // Unit Routes
    Route::prefix('units')->group(function () {
        Route::get('/', [UnitController::class, 'index']);
        Route::get('/{id}', [UnitController::class, 'show']);
        Route::post('/', [UnitController::class, 'store']);          // Has internal admin check
        Route::put('/{id}', [UnitController::class, 'update']);      // Has internal admin check
        Route::delete('/{id}', [UnitController::class, 'destroy']);  // Has internal admin check
    });

    // Role Routes — read only
    Route::prefix('roles')->group(function () {
        Route::get('/', [RoleController::class, 'index']);
        Route::get('/{id}', [RoleController::class, 'show']);
    });

    // User Routes
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('/{id}', [UserController::class, 'show']);
        Route::post('/', [UserController::class, 'store']);          // Has internal admin check
        Route::put('/{id}', [UserController::class, 'update']);      // Has internal admin check
        Route::delete('/{id}', [UserController::class, 'destroy']);  // Has internal admin check
    });

    // Booking rules (tanggal, ruang, batas policy)
    Route::get('/booking-rules', [\App\Http\Controllers\BookingRuleController::class, 'show']);

    // Reservations
    Route::post('/reservations', [\App\Http\Controllers\ReservationController::class, 'store']);
    Route::put('/reservations/{document}/proposal', [\App\Http\Controllers\ReservationController::class, 'updateProposal']);
    Route::post('/reservations/{document}/cancel', [\App\Http\Controllers\ReservationController::class, 'cancel']);
    Route::get('/reservations/{document}/summary', [\App\Http\Controllers\ReservationController::class, 'summary']);
    Route::post('/rooms/check-availability-batch', [\App\Http\Controllers\ReservationController::class, 'checkAvailability']);

    // Room Routes — Read Only (semua authenticated user)
    Route::prefix('rooms')->group(function () {
        Route::get('/', [RoomController::class, 'index']);
        Route::get('/{id}', [RoomController::class, 'show']);
        Route::post('/{id}/check-availability', [RoomController::class, 'checkAvailability']);
        Route::get('/{id}/schedule', [RoomController::class, 'schedule']);
    });

    // Room Booking Routes — read only, except completion by room managers
    Route::prefix('room-bookings')->group(function () {
        Route::get('/', [RoomBookingController::class, 'index']);
        Route::get('/statistics', [RoomBookingController::class, 'statistics']);
        Route::get('/weekly-report', [RoomBookingController::class, 'weeklyReport']);
        Route::get('/{id}', [RoomBookingController::class, 'show']);
        Route::post('/{id}/complete', [RoomBookingController::class, 'complete'])
            ->middleware('admin:wadek2,manajer-tata-usaha,spv-sumberdaya');

        // Receipt & QR Code
        Route::get('/{id}/receipt', [RoomBookingController::class, 'receipt']);
        Route::get('/{id}/qrcode', [RoomBookingController::class, 'qrcode']);
    });
});
