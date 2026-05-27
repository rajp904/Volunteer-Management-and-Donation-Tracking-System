<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Organization;
use App\Models\User;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FirebaseAuthController extends Controller
{
    private const GOOGLE_TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';
    private const GOOGLE_JWKS_URL      = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

    /**
     * POST /api/auth/firebase
     *
     * Accepts a Firebase idToken, verifies it with a two-tier approach:
     *   1. Primary  : Google's tokeninfo REST API (simple, no crypto)
     *   2. Fallback : Manual JWK + RS256 JWT verification (robust, offline-capable)
     *
     * Returns a Sanctum token identical in shape to the regular login response.
     */
    public function handle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'idToken' => 'required|string',
            'role'    => 'nullable|string|in:volunteer,donor',
        ]);

        // ── Verify the Firebase ID token (tries two methods) ─────────────────
        try {
            $payload = $this->verifyFirebaseToken($validated['idToken']);
        } catch (\Throwable $e) {
            Log::warning('[FirebaseAuth] Token verification failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Google sign-in failed. Please try again.',
                'detail'  => config('app.debug') ? $e->getMessage() : null,
            ], 401);
        }

        // ── Extract user info from the verified payload ───────────────────────
        $uid         = $payload['sub']          ?? $payload['user_id']      ?? null;
        $email       = $payload['email']        ?? null;
        $name        = $payload['name']         ?? ($email ? explode('@', $email)[0] : 'User');
        $picture     = $payload['picture']      ?? null;
        $phoneNumber = $payload['phone_number'] ?? null;
        $provider    = $this->resolveProvider($payload);

        if (!$uid) {
            return response()->json(['message' => 'Invalid token: missing user ID.'], 400);
        }

        // ── Upsert user in MongoDB ────────────────────────────────────────────
        $user = $this->findOrCreateUser($uid, $email, $phoneNumber, $name, $picture, $provider);

        // ── Assign role (only if first login) ────────────────────────────────
        $requestedRole = strtolower($validated['role'] ?? 'volunteer');
        $spatieRole    = ($requestedRole === 'donor') ? 'donor' : 'volunteer';

        try {
            if ($user->roles->isEmpty()) {
                $user->assignRole($spatieRole);
            }
        } catch (\Throwable $e) {
            Log::warning('[FirebaseAuth] Role assignment failed: ' . $e->getMessage());
        }

        // ── Update last login ─────────────────────────────────────────────────
        try { $user->update(['last_login_at' => now()]); } catch (\Throwable) {}

        // ── Issue Sanctum token ───────────────────────────────────────────────
        $token = $user->createToken('firebase_auth')->plainTextToken;

        // ── Audit log ─────────────────────────────────────────────────────────
        try { AuditLog::record("user.login.{$provider}", $user); } catch (\Throwable) {}

        // ── Redirect hint ─────────────────────────────────────────────────────
        $roles      = $user->roles->pluck('name')->toArray();
        $redirectTo = '/';
        if (array_intersect(['super-admin', 'org-admin', 'coordinator', 'accountant', 'auditor'], $roles)) {
            $redirectTo = '/dashboard';
        }

        Log::info("[FirebaseAuth] ✓ Login: {$email} via {$provider}");

        return response()->json([
            'message'     => 'Login successful',
            'user'        => $user->load('roles'),
            'token'       => $token,
            'redirect_to' => $redirectTo,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Token verification — dual approach
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Verify a Firebase ID token using two methods in order:
     *   1. Google tokeninfo API  — fast, simple, no local crypto needed
     *   2. Local JWK + RS256     — reliable fallback when tokeninfo is rate-limited
     *
     * Returns the decoded claims as an associative array.
     */
    private function verifyFirebaseToken(string $idToken): array
    {
        // Method 1: Google tokeninfo (primary)
        try {
            return $this->verifyViaTokenInfo($idToken);
        } catch (\Throwable $e) {
            Log::debug('[FirebaseAuth] tokeninfo failed, trying JWK fallback: ' . $e->getMessage());
        }

        // Method 2: Local JWK verification (fallback)
        return $this->verifyViaJwk($idToken);
    }

    /**
     * Method 1: Verify using Google's tokeninfo REST endpoint.
     * Simple but subject to rate limits — we retry once on transient failures.
     */
    private function verifyViaTokenInfo(string $idToken): array
    {
        $projectId = config('services.firebase.project_id', 'one-world---one-family');
        $apiKey    = config('services.firebase.api_key', '');

        $response = Http::timeout(8)->retry(2, 300)->get(self::GOOGLE_TOKENINFO_URL, [
            'id_token' => $idToken,
        ]);

        if (!$response->successful()) {
            $err = $response->json('error_description') ?? $response->json('error') ?? 'unknown';
            throw new \RuntimeException("tokeninfo rejected token: {$err}");
        }

        $payload = $response->json();

        // Validate audience
        $aud = $payload['aud'] ?? '';
        if ($aud !== $projectId && $aud !== $apiKey && !str_contains($aud, $projectId)) {
            throw new \RuntimeException("tokeninfo: bad audience '{$aud}'");
        }

        // Validate issuer
        $iss = $payload['iss'] ?? '';
        if (
            !str_starts_with($iss, 'https://securetoken.google.com/') &&
            !str_starts_with($iss, 'https://accounts.google.com')
        ) {
            throw new \RuntimeException("tokeninfo: bad issuer '{$iss}'");
        }

        // Validate expiry
        if (((int)($payload['exp'] ?? 0)) < time()) {
            throw new \RuntimeException('tokeninfo: token expired');
        }

        return $payload;
    }

    /**
     * Method 2: Verify using Google's JWK public keys + local RS256 decode.
     * More robust — works even when tokeninfo is rate-limited or slow.
     */
    private function verifyViaJwk(string $idToken): array
    {
        $projectId = config('services.firebase.project_id', 'one-world---one-family');

        // Cache the JWK key set for 1 hour (Google rotates keys daily)
        $jwkData = Cache::remember('firebase_jwks', 3600, function () {
            $res = Http::timeout(10)->retry(2, 500)->get(self::GOOGLE_JWKS_URL);
            if (!$res->successful()) {
                throw new \RuntimeException('Could not fetch Firebase public keys.');
            }
            return $res->json();
        });

        // firebase/php-jwt v7 expects { "keys": [...] }
        $keysPayload = isset($jwkData['keys']) ? $jwkData : ['keys' => array_values($jwkData)];
        $keys        = JWK::parseKeySet($keysPayload);

        // Decode & verify RS256 signature
        /** @var object $decoded */
        $decoded = JWT::decode($idToken, $keys);

        $now = time();

        if (($decoded->exp ?? 0) < $now) {
            throw new \RuntimeException('JWK: token expired.');
        }
        if (($decoded->iat ?? 0) > $now + 60) {
            throw new \RuntimeException('JWK: token iat is in the future.');
        }
        if (($decoded->aud ?? '') !== $projectId) {
            throw new \RuntimeException("JWK: bad audience '{$decoded->aud}', expected '{$projectId}'");
        }
        if (($decoded->iss ?? '') !== "https://securetoken.google.com/{$projectId}") {
            throw new \RuntimeException("JWK: bad issuer '{$decoded->iss}'");
        }

        // Convert stdClass → array so callers use the same format as tokeninfo
        return json_decode(json_encode($decoded), true);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // User management
    // ─────────────────────────────────────────────────────────────────────────

    private function findOrCreateUser(
        string  $uid,
        ?string $email,
        ?string $phoneNumber,
        string  $name,
        ?string $picture,
        string  $provider
    ): User {
        // 1. Match by firebase_uid (most reliable)
        $user = User::where('firebase_uid', $uid)->first();

        // 2. Match by email (user registered with email/password earlier)
        if (!$user && $email) {
            $user = User::where('email', strtolower($email))->first();
        }

        // 3. Match by phone
        if (!$user && $phoneNumber) {
            $user = User::where('phone', $phoneNumber)->first();
        }

        $org = Organization::first();

        if ($user) {
            $update = ['firebase_uid' => $uid, 'auth_provider' => $provider];
            if ($picture)                      $update['photo_url'] = $picture;
            if ($picture && !$user->avatar)    $update['avatar']    = $picture;
            if ($phoneNumber && !$user->phone) $update['phone']     = $phoneNumber;
            $user->update($update);
        } else {
            $user = User::create([
                'name'            => $name,
                'email'           => $email ? strtolower($email) : null,
                'phone'           => $phoneNumber,
                'password'        => Hash::make(Str::random(32)),
                'firebase_uid'    => $uid,
                'auth_provider'   => $provider,
                'photo_url'       => $picture,
                'avatar'          => $picture,
                'organization_id' => $org?->id ?? null,
                'is_active'       => true,
            ]);
        }

        return $user;
    }

    private function resolveProvider(array $payload): string
    {
        // Firebase tokens carry sign_in_provider inside the firebase claim
        $signInProvider = $payload['firebase']['sign_in_provider']
                       ?? $payload['sign_in_provider']
                       ?? null;

        if ($signInProvider) {
            return match ($signInProvider) {
                'google.com' => 'google',
                'phone'      => 'phone',
                'github.com' => 'github',
                'password'   => 'email',
                default      => $signInProvider,
            };
        }

        $iss = $payload['iss'] ?? '';
        if (str_contains($iss, 'accounts.google.com')) return 'google';
        return 'email';
    }
}
