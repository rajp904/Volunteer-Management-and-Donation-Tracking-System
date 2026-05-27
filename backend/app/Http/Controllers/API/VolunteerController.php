<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Volunteer;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class VolunteerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Volunteer::with(['user', 'organization', 'skills'])
            ->where('organization_id', $request->user()->organization_id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $volunteers = $query->latest()->paginate($request->get('per_page', 15));

        return response()->json($volunteers);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'                      => 'required|string|max:255',
            'email'                     => 'required|email',
            'phone'                     => 'nullable|string|max:20',
            'skills'                    => 'nullable|string',
            'interests'                 => 'nullable|string',
            'notes'                     => 'nullable|string',
            'joined_date'               => 'nullable|date',
            'status'                    => 'nullable|in:pending,active,inactive,suspended',
            'background_check_status'   => 'nullable|in:not_started,in_progress,cleared,failed',
            'emergency_contact_name'    => 'nullable|string',
            'emergency_contact_phone'   => 'nullable|string',
            'emergency_contact_relation'=> 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $emailLower = strtolower(trim($request->email));

        // Reuse existing user or create a new one
        $user = User::firstOrCreate(
            ['email' => $emailLower],
            [
                'name'            => $request->name,
                'phone'           => $request->phone,
                'password'        => bcrypt(Str::random(16)),
                'organization_id' => $request->user()->organization_id,
                'is_active'       => true,
            ]
        );

        // Assign volunteer role
        try { $user->assignRole('volunteer'); } catch (\Throwable) {}

        // Prevent duplicate volunteer record for same org
        if (Volunteer::where('user_id', $user->id)->where('organization_id', $request->user()->organization_id)->exists()) {
            return response()->json(['message' => 'This user is already a volunteer in your organization.'], 422);
        }

        $volunteer = Volunteer::create([
            'user_id'                    => $user->id,
            'organization_id'            => $request->user()->organization_id,
            'volunteer_id'               => 'VOL-' . strtoupper(Str::random(8)),
            'skills'                     => $request->skills,
            'interests'                  => $request->interests,
            'notes'                      => $request->notes,
            'joined_date'                => $request->joined_date ?? now(),
            'status'                     => $request->status ?? 'active',
            'background_check_status'    => $request->background_check_status ?? 'not_started',
            'emergency_contact_name'     => $request->emergency_contact_name,
            'emergency_contact_phone'    => $request->emergency_contact_phone,
            'emergency_contact_relation' => $request->emergency_contact_relation,
        ]);

        AuditLog::record('volunteer.created', $volunteer, [], $volunteer->toArray());

        return response()->json([
            'message'   => 'Volunteer created successfully',
            'volunteer' => $volunteer->load('user', 'skills'),
        ], 201);
    }

    public function show(Volunteer $volunteer): JsonResponse
    {
        return response()->json($volunteer->load([
            'user', 'organization', 'skills',
            'eventAssignments.event', 'attendance', 'certificates'
        ]));
    }

    public function update(Request $request, Volunteer $volunteer): JsonResponse
    {
        $old = $volunteer->toArray();

        $validator = Validator::make($request->all(), [
            'skills' => 'nullable|string',
            'interests' => 'nullable|string',
            'status' => 'nullable|in:pending,active,inactive,suspended',
            'background_check_status' => 'nullable|in:not_started,in_progress,cleared,failed',
            'emergency_contact_name' => 'nullable|string',
            'emergency_contact_phone' => 'nullable|string',
            'emergency_contact_relation' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $volunteer->update($request->only([
            'skills', 'interests', 'status', 'background_check_status',
            'background_check_date', 'emergency_contact_name',
            'emergency_contact_phone', 'emergency_contact_relation', 'notes',
        ]));

        AuditLog::record('volunteer.updated', $volunteer, $old, $volunteer->toArray());

        return response()->json(['message' => 'Volunteer updated', 'volunteer' => $volunteer->load('user', 'skills')]);
    }

    public function destroy(Volunteer $volunteer): JsonResponse
    {
        AuditLog::record('volunteer.deleted', $volunteer, $volunteer->toArray());
        $volunteer->delete();
        return response()->json(['message' => 'Volunteer deleted']);
    }

    public function stats(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;

        return response()->json([
            'total'       => (int)   Volunteer::where('organization_id', $orgId)->count(),
            'active'      => (int)   Volunteer::where('organization_id', $orgId)->where('status', 'active')->count(),
            'pending'     => (int)   Volunteer::where('organization_id', $orgId)->where('status', 'pending')->count(),
            'inactive'    => (int)   Volunteer::where('organization_id', $orgId)->where('status', 'inactive')->count(),
            'total_hours' => (float) (string) Volunteer::where('organization_id', $orgId)->sum('total_hours'),
        ]);
    }
}
