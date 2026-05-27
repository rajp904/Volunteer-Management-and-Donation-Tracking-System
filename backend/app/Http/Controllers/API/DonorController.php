<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\DonorProfile;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class DonorController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DonorProfile::with(['organization'])
            ->withCount('donations')
            ->where('organization_id', $request->user()->organization_id);

        if ($request->filled('type')) {
            $query->where('donor_type', $request->type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('donor_id', 'like', "%{$search}%");
            });
        }

        return response()->json($query->latest()->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'         => 'required|string|max:255',
            'email'        => 'nullable|email',
            'phone'        => 'nullable|string',
            'donor_type'   => 'nullable|in:individual,corporate,trust,government,ngo,other',
            'address'      => 'nullable|string',
            'city'         => 'nullable|string',
            'state'        => 'nullable|string',
            'country'      => 'nullable|string',
            'pan_number'   => 'nullable|string',
            'is_anonymous' => 'nullable|boolean',
            'is_recurring' => 'nullable|boolean',
            'notes'        => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $donor = DonorProfile::create([
            'organization_id' => $request->user()->organization_id,
            'donor_id'        => 'DON-' . strtoupper(Str::random(8)),
            'name'            => $request->name,
            'email'           => $request->email,
            'phone'           => $request->phone,
            'donor_type'      => $request->donor_type ?? 'individual',
            'address'         => $request->address,
            'city'            => $request->city,
            'state'           => $request->state,
            'country'         => $request->country,
            'pan_number'      => $request->pan_number,
            'is_anonymous'    => $request->is_anonymous ?? false,
            'is_recurring'    => $request->is_recurring ?? false,
            'notes'           => $request->notes,
        ]);

        AuditLog::record('donor.created', $donor, [], $donor->toArray());

        return response()->json(['message' => 'Donor created', 'donor' => $donor], 201);
    }

    public function show(DonorProfile $donorProfile): JsonResponse
    {
        return response()->json($donorProfile->load(['donations.program', 'recurringDonations']));
    }

    public function update(Request $request, DonorProfile $donorProfile): JsonResponse
    {
        $old = $donorProfile->toArray();
        $donorProfile->update($request->only([
            'name', 'email', 'phone', 'donor_type', 'address', 'city',
            'state', 'country', 'pan_number', 'is_anonymous', 'is_recurring', 'notes',
        ]));
        AuditLog::record('donor.updated', $donorProfile, $old, $donorProfile->toArray());
        return response()->json(['message' => 'Donor updated', 'donor' => $donorProfile]);
    }

    public function destroy(DonorProfile $donorProfile): JsonResponse
    {
        AuditLog::record('donor.deleted', $donorProfile, $donorProfile->toArray());
        $donorProfile->delete();
        return response()->json(['message' => 'Donor deleted']);
    }

    public function topDonors(Request $request): JsonResponse
    {
        $donors = DonorProfile::where('organization_id', $request->user()->organization_id)
            ->orderByDesc('total_donated')
            ->take(10)
            ->get();

        return response()->json($donors);
    }
}
