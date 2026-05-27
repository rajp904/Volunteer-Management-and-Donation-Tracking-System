<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\FirebaseAuthController;
use App\Http\Controllers\API\DashboardController;
use App\Http\Controllers\API\VolunteerController;
use App\Http\Controllers\API\DonationController;
use App\Http\Controllers\API\DonorController;
use App\Http\Controllers\API\ProgramController;
use App\Http\Controllers\API\EventController;
use App\Http\Controllers\API\ExpenseController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\AnnouncementController;
use App\Http\Controllers\API\CertificateController;
use App\Http\Controllers\API\AssignmentController;
use App\Http\Controllers\API\AuditLogController;
use App\Http\Controllers\API\PaymentController;
use App\Models\VolunteerNotification;

// Public routes
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
    // Firebase token exchange — verifies Firebase idToken, returns Sanctum token
    Route::post('/firebase', [FirebaseAuthController::class, 'handle']);
});

// Public programs — only show active / completed, never deleted or draft/cancelled
Route::get('/public/programs', function () {
    return \App\Models\Program::whereIn('status', ['active', 'completed'])
        ->whereNull('deleted_at')   // explicit safety: exclude soft-deleted programs
        ->select(['id', 'name', 'description', 'slug', 'banner_image', 'budget', 'spent',
                  'location', 'start_date', 'end_date', 'status', 'volunteer_target'])
        ->orderBy('status', 'asc') // 'active' sorts before 'completed' alphabetically
        ->get()
        ->map(fn($p) => [
            'id'               => $p->id,
            'name'             => $p->name,
            'description'      => $p->description,
            'slug'             => $p->slug,
            'location'         => $p->location,
            'status'           => $p->status,
            'budget'           => (float) $p->budget,
            'spent'            => (float) $p->spent,
            'volunteer_target' => (int) $p->volunteer_target,
            'start_date'       => $p->start_date,
            'end_date'         => $p->end_date,
            'banner_image'     => $p->banner_image,
        ]);
});

Route::get('/public/stats', function () {
    $orgId = 1; // Default org
    return response()->json([
        'volunteers'      => (int)   \App\Models\Volunteer::where('organization_id', $orgId)->where('status', 'active')->count(),
        'donations_total' => (float) (string) \App\Models\Donation::where('organization_id', $orgId)->where('status', 'completed')->sum('amount'),
        'programs'        => (int)   \App\Models\Program::where('organization_id', $orgId)->count(),
        'donors'          => (int)   \App\Models\DonorProfile::where('organization_id', $orgId)->count(),
    ]);
});

// ────────────────────────────────────────────────────────────────────────────
// Direct Donation Route (PUBLIC — no auth required, no payment gateway)
// ────────────────────────────────────────────────────────────────────────────
Route::post('/public/donations/donate', [PaymentController::class, 'directDonate']);

// Public volunteer application — no auth required
Route::post('/public/volunteer-apply', function (Request $request) {
    $validated = $request->validate([
        'name'         => 'required|string|max:255',
        'email'        => 'required|email',
        'phone'        => 'required|string|max:20',
        'city'         => 'nullable|string|max:100',
        'skills'       => 'nullable|array',
        'availability' => 'nullable|array',
        'message'      => 'nullable|string',
    ]);

    $emailLower = strtolower(trim($validated['email']));
    $org        = \App\Models\Organization::first();

    // ── STEP 1: Mirror to MongoDB Atlas immediately (before any early returns) ──
    try {
        (new \App\Services\MongoDBService())->storeVolunteer([
            'name'         => $validated['name'],
            'email'        => $emailLower,
            'phone'        => $validated['phone'] ?? null,
            'city'         => $validated['city'] ?? null,
            'skills'       => $validated['skills'] ?? [],
            'availability' => $validated['availability'] ?? [],
            'message'      => $validated['message'] ?? null,
        ]);
        \Illuminate\Support\Facades\Log::info('[MongoDB] Volunteer registration stored', [
            'name'  => $validated['name'],
            'email' => $emailLower,
        ]);
    } catch (\Throwable $e) {
        \Illuminate\Support\Facades\Log::warning('[MongoDB] volunteer mirror failed: ' . $e->getMessage());
    }

    // ── STEP 2: Find or create the user account ──────────────────────────────
    $user = \App\Models\User::where('email', $emailLower)->first();

    if ($user) {
        // User already has an account — check if they already have a volunteer record
        $existing = \App\Models\Volunteer::where('user_id', $user->id)->latest()->first();

        if ($existing) {
            if ($existing->status === 'pending') {
                return response()->json([
                    'message' => 'Your application is already submitted and is awaiting admin review.',
                    'id'      => $existing->id,
                    'status'  => 'pending',
                ], 200);
            }
            if ($existing->status === 'active') {
                return response()->json([
                    'message' => 'You are already an approved volunteer! Welcome to One World One Family 🎉',
                    'id'      => $existing->id,
                    'status'  => 'active',
                ], 200);
            }
        }

        if (!$user->phone && !empty($validated['phone'])) {
            $user->update(['phone' => $validated['phone']]);
        }
    } else {
        $user = \App\Models\User::create([
            'name'            => $validated['name'],
            'email'           => $emailLower,
            'phone'           => $validated['phone'] ?? null,
            'password'        => bcrypt(\Illuminate\Support\Str::random(16)),
            'organization_id' => $org?->id ?? null,
            'is_active'       => true,
        ]);
    }

    // ── STEP 3: Ensure volunteer role ─────────────────────────────────────────
    try {
        $user->assignRole('volunteer');
    } catch (\Throwable $e) {
        \Illuminate\Support\Facades\Log::warning('Role assignment failed: ' . $e->getMessage());
    }

    // ── STEP 4: Create volunteer record as pending ────────────────────────────
    $volunteer = \App\Models\Volunteer::create([
        'user_id'         => $user->id,
        'organization_id' => $org?->id ?? null,
        'volunteer_id'    => 'VOL-' . strtoupper(\Illuminate\Support\Str::random(8)),
        'skills'          => implode(', ', $validated['skills'] ?? []),
        'interests'       => implode(', ', $validated['availability'] ?? []),
        'notes'           => $validated['message'] ?? null,
        'joined_date'     => now(),
        'status'          => 'pending',
    ]);

    return response()->json([
        'message' => 'Application submitted successfully. Awaiting admin approval.',
        'id'      => $volunteer->id,
    ], 201);
});

// ────────────────────────────────────────────────────────────────────────────
// Contact Form (PUBLIC) — saves to MongoDB Atlas
// ────────────────────────────────────────────────────────────────────────────
Route::post('/public/contact', function (Request $request) {
    $validated = $request->validate([
        'name'    => 'required|string|max:255',
        'email'   => 'required|email|max:255',
        'phone'   => 'nullable|string|max:20',
        'subject' => 'required|string|max:255',
        'message' => 'required|string|min:10',
    ]);

    try {
        (new \App\Services\MongoDBService())->storeContact($validated);
    } catch (\Throwable $e) {
        \Illuminate\Support\Facades\Log::error('[MongoDB] contact form failed: ' . $e->getMessage());
        return response()->json(['message' => 'Failed to save message. Please try again.'], 500);
    }

    \Illuminate\Support\Facades\Log::info('Contact form submitted', [
        'name'    => $validated['name'],
        'email'   => $validated['email'],
        'subject' => $validated['subject'],
    ]);

    return response()->json([
        'message' => 'Thank you! We\'ve received your message and will reply within 24-48 hours.',
    ], 201);
});

// Public: check volunteer application status by email
Route::get('/public/volunteer-status', function (Request $request) {
    $request->validate(['email' => 'required|email']);

    $emailLower = strtolower(trim($request->email));

    // Find the most recent volunteer record for this email
    $user = \App\Models\User::where('email', $emailLower)->first();

    if (!$user) {
        return response()->json(['found' => false, 'message' => 'No application found for this email.'], 404);
    }

    $volunteer = \App\Models\Volunteer::where('user_id', $user->id)->latest()->first();

    if (!$volunteer) {
        return response()->json(['found' => false, 'message' => 'No application found for this email.'], 404);
    }

    // Fetch unread notifications for this email
    $notification = VolunteerNotification::where('email', $emailLower)
        ->where('volunteer_id', $volunteer->id)
        ->latest()
        ->first();

    // Mark notification as read once fetched
    if ($notification && !$notification->read) {
        $notification->update(['read' => true]);
    }

    return response()->json([
        'found'            => true,
        'status'           => $volunteer->status,
        'volunteer_id'     => $volunteer->volunteer_id,
        'name'             => $user->name,
        'applied_at'       => $volunteer->created_at,
        'notification'     => $notification ? [
            'type'    => $notification->type,
            'message' => $notification->message,
            'read'    => $notification->read,
            'date'    => $notification->created_at,
        ] : null,
    ]);
});

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });

    // Profile & Password (alternate paths used by frontend)
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    Route::put('/profile/password', [AuthController::class, 'changePassword']);

    // Organization settings
    Route::get('/organization', function (Request $request) {
        return response()->json(['data' => $request->user()->organization]);
    });
    Route::put('/organization', function (Request $request) {
        $org = $request->user()->organization;
        if (!$org) {
            return response()->json(['message' => 'Organization not found'], 404);
        }
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|nullable|email',
            'phone' => 'sometimes|nullable|string|max:20',
            'website' => 'sometimes|nullable|url',
            'address' => 'sometimes|nullable|string',
            'city' => 'sometimes|nullable|string|max:100',
            'state' => 'sometimes|nullable|string|max:100',
            'country' => 'sometimes|nullable|string|max:100',
            'description' => 'sometimes|nullable|string',
            'registration_number' => 'sometimes|nullable|string|max:100',
        ]);
        $org->update($validated);
        return response()->json(['data' => $org]);
    });

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'overview']);

    // Volunteers
    Route::prefix('volunteers')->group(function () {
        Route::get('/', [VolunteerController::class, 'index']);
        Route::post('/', [VolunteerController::class, 'store']);
        Route::get('/stats', [VolunteerController::class, 'stats']);
        Route::get('/{volunteer}', [VolunteerController::class, 'show']);
        Route::put('/{volunteer}', [VolunteerController::class, 'update']);
        Route::delete('/{volunteer}', [VolunteerController::class, 'destroy']);
        // Quick approve / reject — creates notification for the volunteer
        Route::patch('/{volunteer}/status', function (Request $request, \App\Models\Volunteer $volunteer) {
            $request->validate(['status' => 'required|in:active,inactive,suspended,pending']);
            $old = $volunteer->toArray();
            $volunteer->update(['status' => $request->status]);
            \App\Models\AuditLog::record('volunteer.status_changed', $volunteer, $old, $volunteer->toArray());

            // Create in-app notification for volunteer
            $volunteerUser = $volunteer->user;
            if ($volunteerUser && in_array($request->status, ['active', 'inactive'])) {
                $type    = $request->status === 'active' ? 'approved' : 'rejected';
                $message = $request->status === 'active'
                    ? "Congratulations! Your volunteer application has been approved. Welcome to the One World One Family volunteer family! 🎉"
                    : "We regret to inform you that your volunteer application has not been approved at this time. You may reapply in the future.";

                VolunteerNotification::create([
                    'volunteer_id'   => $volunteer->id,
                    'email'          => strtolower($volunteerUser->email),
                    'type'           => $type,
                    'volunteer_name' => $volunteerUser->name,
                    'message'        => $message,
                ]);
            }

            return response()->json(['message' => 'Status updated', 'volunteer' => $volunteer->load('user')]);
        });
    });

    // Donors
    Route::prefix('donors')->group(function () {
        Route::get('/', [DonorController::class, 'index']);
        Route::post('/', [DonorController::class, 'store']);
        Route::get('/top', [DonorController::class, 'topDonors']);
        Route::get('/{donorProfile}', [DonorController::class, 'show']);
        Route::put('/{donorProfile}', [DonorController::class, 'update']);
        Route::delete('/{donorProfile}', [DonorController::class, 'destroy']);
    });

    // Donations
    Route::prefix('donations')->group(function () {
        Route::get('/', [DonationController::class, 'index']);
        Route::post('/', [DonationController::class, 'store']);
        Route::get('/stats', [DonationController::class, 'stats']);
        Route::get('/{donation}', [DonationController::class, 'show']);
        Route::put('/{donation}', [DonationController::class, 'update']);
        Route::delete('/{donation}', [DonationController::class, 'destroy']);
        Route::get('/{donation}/receipt', [DonationController::class, 'generateReceipt']);
    });

    // Programs
    Route::prefix('programs')->group(function () {
        Route::get('/', [ProgramController::class, 'index']);
        Route::post('/', [ProgramController::class, 'store']);
        Route::get('/stats', [ProgramController::class, 'stats']);
        Route::get('/{program}', [ProgramController::class, 'show']);
        Route::put('/{program}', [ProgramController::class, 'update']);
        Route::delete('/{program}', [ProgramController::class, 'destroy']);
    });

    // Events
    Route::prefix('events')->group(function () {
        Route::get('/', [EventController::class, 'index']);
        Route::post('/', [EventController::class, 'store']);
        Route::get('/upcoming', [EventController::class, 'upcoming']);
        Route::get('/{event}', [EventController::class, 'show']);
        Route::put('/{event}', [EventController::class, 'update']);
        Route::delete('/{event}', [EventController::class, 'destroy']);
        Route::post('/{event}/assign-volunteer', [EventController::class, 'assignVolunteer']);
    });

    // Assignments (uses event_volunteers table)
    Route::prefix('assignments')->group(function () {
        Route::get('/', [AssignmentController::class, 'index']);
        Route::post('/', [AssignmentController::class, 'store']);
        Route::patch('/{eventVolunteer}', [AssignmentController::class, 'update']);
        Route::put('/{eventVolunteer}', [AssignmentController::class, 'update']);
        Route::delete('/{eventVolunteer}', [AssignmentController::class, 'destroy']);
    });

    // Expenses
    Route::prefix('expenses')->group(function () {
        Route::get('/', [ExpenseController::class, 'index']);
        Route::post('/', [ExpenseController::class, 'store']);
        Route::get('/stats', [ExpenseController::class, 'stats']);
        Route::get('/{expense}', [ExpenseController::class, 'show']);
        Route::put('/{expense}', [ExpenseController::class, 'update']);
        Route::delete('/{expense}', [ExpenseController::class, 'destroy']);
    });

    // Certificates
    Route::prefix('certificates')->group(function () {
        Route::get('/', [CertificateController::class, 'index']);
        Route::post('/', [CertificateController::class, 'store']);
        Route::get('/{certificate}', [CertificateController::class, 'show']);
        Route::delete('/{certificate}', [CertificateController::class, 'destroy']);
    });

    // Reports
    Route::prefix('reports')->group(function () {
        Route::get('/volunteers/hours', [ReportController::class, 'volunteerHoursReport']);
        Route::get('/donations/summary', [ReportController::class, 'donationSummaryReport']);
        Route::get('/programs/expenditure', [ReportController::class, 'programExpenditureReport']);
        Route::get('/audit-logs', [ReportController::class, 'auditLogsReport']);
    });

    // Audit Logs
    Route::get('/audit-logs', [AuditLogController::class, 'index']);

    // Announcements
    Route::apiResource('announcements', AnnouncementController::class)->missing(
        fn() => response()->json(['message' => 'Not found'], 404)
    );

    // Users management (admin)
    Route::prefix('users')->group(function () {
        Route::get('/', function (Request $request) {
            $users = \App\Models\User::with('roles')
                ->where('organization_id', $request->user()->organization_id)
                ->latest()
                ->paginate(15);
            return response()->json($users);
        });
        Route::get('/{user}', function (\App\Models\User $user) {
            return response()->json($user->load('roles', 'volunteer'));
        });
    });
});
