<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Donation;
use App\Models\DonorProfile;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class DonationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Donation::with(['donorProfile', 'program', 'organization'])
            ->where('organization_id', $request->user()->organization_id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('donation_type', $request->type);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('donation_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('donation_date', '<=', $request->to_date);
        }

        if ($request->filled('program_id')) {
            $query->where('program_id', $request->program_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('donorProfile', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })->orWhere('receipt_number', 'like', "%{$search}%");
        }

        $donations = $query->latest('donation_date')->paginate($request->get('per_page', 15));

        return response()->json($donations);
    }

    public function store(Request $request): JsonResponse
    {
        $isAnonymous = (bool) ($request->is_anonymous ?? false);

        $validator = Validator::make($request->all(), [
            'donor_profile_id' => $isAnonymous ? 'nullable' : 'nullable|exists:donor_profiles,id',
            'amount'           => 'required|numeric|min:1',
            'donation_type'    => 'required|in:cash,cheque,online,in_kind,bank_transfer,upi',
            'donation_date'    => 'required|date',
            'status'           => 'nullable|in:pending,completed,failed,refunded',
            'program_id'       => 'nullable|exists:programs,id',
            'purpose'          => 'nullable|string',
            'notes'            => 'nullable|string',
            'transaction_id'   => 'nullable|string',
            'cheque_number'    => 'nullable|string',
            'is_anonymous'     => 'nullable|boolean',
            'is_tax_exempted'  => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $donation = Donation::create([
            'donor_profile_id' => $isAnonymous ? null : $request->donor_profile_id,
            'organization_id'  => $request->user()->organization_id,
            'program_id'       => $request->program_id,
            'receipt_number'   => 'REC-' . date('Y') . '-' . strtoupper(Str::random(8)),
            'amount'           => $request->amount,
            'donation_type'    => $request->donation_type,
            'status'           => $request->status ?? 'completed',
            'donation_date'    => $request->donation_date,
            'purpose'          => $request->purpose,
            'notes'            => $request->notes,
            'transaction_id'   => $request->transaction_id,
            'cheque_number'    => $request->cheque_number,
            'is_anonymous'     => $isAnonymous,
            'is_tax_exempted'  => $request->is_tax_exempted ?? false,
        ]);

        // Update donor total if not anonymous
        if (!$isAnonymous && $donation->donorProfile) {
            $donation->donorProfile->increment('total_donated', $request->amount);
        }

        AuditLog::record('donation.created', $donation, [], $donation->toArray());

        return response()->json([
            'message'  => 'Donation recorded successfully',
            'donation' => $donation->load('donorProfile', 'program'),
        ], 201);
    }

    public function show(Donation $donation): JsonResponse
    {
        return response()->json($donation->load(['donorProfile', 'program', 'items', 'fundAllocations.program']));
    }

    public function update(Request $request, Donation $donation): JsonResponse
    {
        $old = $donation->toArray();
        $donation->update($request->only([
            'status', 'notes', 'purpose', 'program_id',
            'donation_type', 'donation_date', 'amount',
            'transaction_id', 'is_anonymous', 'is_tax_exempted',
        ]));
        AuditLog::record('donation.updated', $donation, $old, $donation->toArray());
        return response()->json(['message' => 'Donation updated', 'donation' => $donation->load('donorProfile', 'program')]);
    }

    public function destroy(Donation $donation): JsonResponse
    {
        AuditLog::record('donation.deleted', $donation, $donation->toArray());
        $donation->delete();
        return response()->json(['message' => 'Donation deleted']);
    }

    public function stats(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;

        $totalDonations = (float) (string) Donation::where('organization_id', $orgId)
            ->where('status', 'completed')->sum('amount');

        $monthlyDonations = (float) (string) Donation::where('organization_id', $orgId)
            ->where('status', 'completed')
            ->whereMonth('donation_date', now()->month)
            ->whereYear('donation_date', now()->year)
            ->sum('amount');

        $byType = Donation::where('organization_id', $orgId)
            ->where('status', 'completed')
            ->selectRaw('donation_type, sum(amount) as total, count(*) as count')
            ->groupBy('donation_type')
            ->get()
            ->map(fn($r) => [
                'donation_type' => $r->donation_type,
                'total'         => (float) (string) $r->total,
                'count'         => (int)   $r->count,
            ]);

        $monthlyTrend = Donation::where('organization_id', $orgId)
            ->where('status', 'completed')
            ->whereYear('donation_date', now()->year)
            ->selectRaw('MONTH(donation_date) as month, sum(amount) as total, count(*) as count')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn($r) => [
                'month' => (int)   $r->month,
                'total' => (float) (string) $r->total,
                'count' => (int)   $r->count,
            ]);

        return response()->json([
            'total_amount'  => $totalDonations,
            'monthly_amount'=> $monthlyDonations,
            'total_count'   => (int) Donation::where('organization_id', $orgId)->where('status', 'completed')->count(),
            'by_type'       => $byType,
            'monthly_trend' => $monthlyTrend,
        ]);
    }

    public function generateReceipt(Donation $donation)
    {
        $pdf = app('dompdf.wrapper');
        $pdf->loadView('receipts.donation', ['donation' => $donation->load(['donorProfile', 'organization', 'program'])]);
        return $pdf->download("receipt-{$donation->receipt_number}.pdf");
    }
}
