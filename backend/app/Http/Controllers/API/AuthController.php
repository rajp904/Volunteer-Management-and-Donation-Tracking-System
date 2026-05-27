<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use App\Services\MongoDBService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        // ── Step 1: Validate format (no unique rule — we check manually below) ──
        $validator = Validator::make($request->all(), [
            'name'                  => 'nullable|string|max:255',
            'email'                 => 'required|string|email|max:255',
            'password'              => 'required|string|min:8|confirmed',
            'phone'                 => 'nullable|string|max:20',
            'role'                  => 'nullable|string|in:volunteer,donor,Volunteer,Donor',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // ── Step 2: Manually check for duplicate email in MongoDB `users` collection ──
        $emailLower = strtolower(trim($request->email));
        $exists = User::where('email', $emailLower)->first();
        if ($exists) {
            return response()->json([
                'errors' => [
                    'email' => ['This email is already registered. Please sign in.']
                ]
            ], 422);
        }

        // ── Step 3: Get a valid organization_id from MongoDB ──
        $org = \App\Models\Organization::first();

        // ── Step 4: Create user — derive name from email if not provided ──
        $name = trim($request->name ?? '') !== ''
            ? trim($request->name)
            : explode('@', $request->email)[0];

        $user = User::create([
            'name'            => $name,
            'email'           => $emailLower,
            'password'        => Hash::make($request->password),
            'phone'           => $request->phone ?? null,
            'organization_id' => $org?->id ?? null,
            'is_active'       => true,
        ]);

        // ── Step 5: Assign Spatie role ──
        $roleInput = strtolower($request->role ?? 'volunteer');
        $spatiRole = in_array($roleInput, ['donor']) ? 'donor' : 'volunteer';
        try {
            $user->assignRole($spatiRole);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Role assignment failed: ' . $e->getMessage());
        }

        // ── Step 6: Generate Sanctum token ──
        $token = $user->createToken('auth_token')->plainTextToken;

        // ── Step 7: Record audit log (silently — never block registration) ──
        try {
            AuditLog::record('user.register', $user, [], ['email' => $user->email]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('AuditLog failed on register: ' . $e->getMessage());
        }

        // ── Step 8: Mirror to MongoDB Atlas ────────────────────────────────
        try {
            (new MongoDBService())->storeSignup([
                'name'  => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role'  => $spatiRole,
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('[MongoDB] signup mirror failed: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Registration successful',
            'user'    => $user->load('roles'),
            'token'   => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        // ── Step 1: Validate — identifier can be email OR phone ──
        $validator = Validator::make($request->all(), [
            'email'    => 'required|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $identifier = trim($request->email);

        // ── Step 2: Find user by email OR phone number ──
        if (str_contains($identifier, '@')) {
            $user = User::where('email', strtolower($identifier))->first();
        } else {
            $phone = preg_replace('/[\s\-]/', '', $identifier);
            $user  = User::where('phone', $phone)->first();
            if (!$user && !str_starts_with($phone, '+')) {
                $user = User::where('phone', '+' . $phone)->first();
            }
        }

        if (!$user) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        // ── Step 3: Check account status ──
        if (isset($user->is_active) && $user->is_active === false) {
            return response()->json(['message' => 'Account is deactivated. Please contact administrator.'], 403);
        }

        // ── Step 4: Verify password using bcrypt ──
        if (!Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        // ── Step 5: Update lastLogin timestamp in MongoDB ──
        try {
            $user->update(['last_login_at' => now()]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('lastLogin update failed: ' . $e->getMessage());
        }

        // ── Step 6: Generate token via our MongoDB-backed HasMongoApiTokens trait ──
        $token = $user->createToken('auth_token')->plainTextToken;

        // ── Step 7: Record audit log (silently — never block login) ──
        try {
            AuditLog::record('user.login', $user);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('AuditLog failed on login: ' . $e->getMessage());
        }

        // ── Step 8: Determine redirect hint based on Spatie role ──
        $roles = $user->roles->pluck('name')->toArray();
        $redirectTo = '/';
        if (in_array('super-admin', $roles) || in_array('org-admin', $roles) || in_array('coordinator', $roles)) {
            $redirectTo = '/dashboard';
        }

        // ── Step 9: Mirror login to MongoDB Atlas ───────────────────────────
        try {
            (new MongoDBService())->storeLogin([
                'email' => $user->email,
                'name'  => $user->name,
                'role'  => implode(',', $roles),
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('[MongoDB] login mirror failed: ' . $e->getMessage());
        }

        return response()->json([
            'message'     => 'Login successful',
            'user'        => $user->load('roles'),
            'token'       => $token,
            'redirect_to' => $redirectTo,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            AuditLog::record('user.logout');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('AuditLog failed on logout: ' . $e->getMessage());
        }

        try {
            $request->user()?->currentAccessToken()?->delete();
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Token delete failed: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }
            return response()->json($user->load('roles'));
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to fetch user'], 500);
        }
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'bio' => 'nullable|string',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'country' => 'nullable|string',
            'pincode' => 'nullable|string',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $old = $user->toArray();
        $user->update($request->only([
            'name', 'phone', 'bio', 'address', 'city', 'state', 'country', 'pincode', 'date_of_birth', 'gender'
        ]));

        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->update(['avatar' => $path]);
        }

        AuditLog::record('user.profile_updated', $user, $old, $user->toArray());

        return response()->json(['message' => 'Profile updated', 'user' => $user->load('roles', 'organization')]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Current password is incorrect'], 400);
        }

        $user->update(['password' => Hash::make($request->password)]);
        AuditLog::record('user.password_changed', $user);

        return response()->json(['message' => 'Password changed successfully']);
    }
}
