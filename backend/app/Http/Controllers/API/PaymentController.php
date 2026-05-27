<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Donation;
use App\Models\DonorProfile;
use App\Models\Organization;
use App\Models\Program;
use App\Services\MongoDBService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/public/donations/donate
    // Direct donation — no payment gateway, saves instantly, updates program.
    // ─────────────────────────────────────────────────────────────────────────
    public function directDonate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount'     => 'required|numeric|min:10',
            'name'       => 'required|string|max:255',
            'email'      => 'required|email|max:255',
            'phone'      => 'nullable|string|max:20',
            'program'    => 'nullable|string|max:255',
            'program_id' => 'nullable|integer|exists:programs,id',
            'message'    => 'nullable|string|max:1000',
        ]);

        $org        = Organization::first();
        $emailLower = strtolower(trim($validated['email']));

        // ── 1. Get or create DonorProfile ────────────────────────────────────
        $donor = DonorProfile::firstOrCreate(
            ['email' => $emailLower, 'organization_id' => $org?->id],
            [
                'donor_id'      => 'DON-' . strtoupper(Str::random(8)),
                'name'          => $validated['name'],
                'phone'         => $validated['phone'] ?? null,
                'donor_type'    => 'individual',
                'total_donated' => 0,
            ]
        );

        // Keep name/phone fresh
        $donor->fill(array_filter([
            'name'  => $donor->name  ?: $validated['name'],
            'phone' => $donor->phone ?: ($validated['phone'] ?? null),
        ]))->save();

        // ── 2. Generate a unique transaction reference ────────────────────────
        $transactionId  = 'TXN-' . date('Ymd') . '-' . strtoupper(Str::random(10));
        $receiptNumber  = 'REC-' . date('Y') . '-' . strtoupper(Str::random(8));

        // ── 3. Resolve program name ───────────────────────────────────────────
        $program     = isset($validated['program_id'])
            ? Program::find($validated['program_id'])
            : null;
        $programName = $program?->name ?? $validated['program'] ?? 'General Donation';

        // ── 4. Save Donation record ───────────────────────────────────────────
        $donation = Donation::create([
            'donor_profile_id' => $donor->id,
            'organization_id'  => $org?->id,
            'program_id'       => $program?->id ?? null,
            'receipt_number'   => $receiptNumber,
            'amount'           => $validated['amount'],
            'donation_type'    => 'online',
            'status'           => 'completed',
            'currency'         => 'INR',
            'donation_date'    => now()->toDateString(),
            'purpose'          => $programName,
            'notes'            => $validated['message'] ?? null,
            'transaction_id'   => $transactionId,
            'gateway'          => 'direct',
            'is_tax_exempted'  => true,
            'is_anonymous'     => false,
        ]);

        // ── 5. Update donor total donated ─────────────────────────────────────
        $donor->increment('total_donated', $validated['amount']);

        // ── 6. Update program raised (spent) amount ───────────────────────────
        if ($program) {
            $program->increment('spent', $validated['amount']);
            Log::info("Program [{$program->name}] raised amount updated", [
                'program_id'  => $program->id,
                'added'       => $validated['amount'],
                'new_spent'   => $program->fresh()->spent,
            ]);
        }

        // ── 7. Audit log ──────────────────────────────────────────────────────
        AuditLog::record('donation.direct.success', $donation, [], [
            'transaction_id' => $transactionId,
            'amount'         => $validated['amount'],
            'donor'          => $validated['name'],
            'program'        => $programName,
        ]);

        // ── 8. Mirror to MongoDB Atlas ────────────────────────────────────────
        try {
            (new MongoDBService())->storeDonation([
                'name'           => $validated['name'],
                'email'          => $validated['email'],
                'phone'          => $validated['phone'] ?? null,
                'amount'         => $validated['amount'],
                'program'        => $programName,
                'program_id'     => $program?->id,
                'message'        => $validated['message'] ?? null,
                'transaction_id' => $transactionId,
                'receipt_number' => $receiptNumber,
            ]);
        } catch (\Throwable $e) {
            Log::warning('[MongoDB] donation mirror failed: ' . $e->getMessage());
        }

        Log::info('Direct donation saved', [
            'transaction_id' => $transactionId,
            'receipt_number' => $receiptNumber,
            'amount'         => $validated['amount'],
            'donor'          => $validated['name'],
            'program'        => $programName,
        ]);

        return response()->json([
            'message'        => 'Thank you! Your donation has been received.',
            'receipt_number' => $receiptNumber,
            'transaction_id' => $transactionId,
            'amount'         => (float) $validated['amount'],
            'donor_name'     => $donor->name,
            'program'        => $programName,
        ], 201);
    }
}
