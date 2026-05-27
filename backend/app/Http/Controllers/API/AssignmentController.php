<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\EventVolunteer;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    public function index(Request $request)
    {
        $query = EventVolunteer::with(['volunteer.user', 'event.program']);

        // Filter by organization via event
        $query->whereHas('event', function ($q) use ($request) {
            $q->where('organization_id', $request->user()->organization_id);
        });

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('volunteer.user', fn($u) => $u->where('name', 'like', "%{$request->search}%"))
                  ->orWhereHas('event', fn($e) => $e->where('title', 'like', "%{$request->search}%"));
            });
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'volunteer_id' => 'required|exists:volunteers,id',
            'event_id' => 'required|exists:events,id',
            'role' => 'nullable|string|max:255',
        ]);

        $validated['status'] = 'assigned';
        $validated['assigned_at'] = now();

        $assignment = EventVolunteer::firstOrCreate(
            ['volunteer_id' => $validated['volunteer_id'], 'event_id' => $validated['event_id']],
            $validated
        );

        return response()->json($assignment->load('volunteer.user', 'event.program'), 201);
    }

    public function update(Request $request, EventVolunteer $assignment)
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:assigned,confirmed,attended,absent,cancelled',
            'role' => 'sometimes|nullable|string|max:255',
            'hours_logged' => 'sometimes|nullable|numeric|min:0',
            'feedback' => 'sometimes|nullable|string',
        ]);

        if (isset($validated['status'])) {
            if ($validated['status'] === 'confirmed') $assignment->confirmed_at = now();
            if ($validated['status'] === 'attended') $assignment->attended_at = now();
        }

        $assignment->update($validated);

        return response()->json($assignment->load('volunteer.user', 'event.program'));
    }

    public function destroy(EventVolunteer $assignment)
    {
        $assignment->delete();
        return response()->json(null, 204);
    }
}
