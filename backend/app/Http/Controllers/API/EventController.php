<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventVolunteer;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Event::with(['program'])
            ->withCount('volunteerAssignments')
            ->where('organization_id', $request->user()->organization_id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('program_id')) {
            $query->where('program_id', $request->program_id);
        }

        return response()->json($query->orderBy('start_datetime')->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'program_id'       => 'required|exists:programs,id',
            'title'            => 'required|string|max:255',
            'description'      => 'nullable|string',
            'location'         => 'nullable|string',
            'start_datetime'   => 'required|date',
            'end_datetime'     => 'required|date|after:start_datetime',
            'volunteer_needed' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $event = Event::create([
            'program_id'       => $request->program_id,
            'organization_id'  => $request->user()->organization_id,
            'title'            => $request->title,
            'description'      => $request->description,
            'location'         => $request->location,
            'start_datetime'   => $request->start_datetime,
            'end_datetime'     => $request->end_datetime,
            'volunteer_needed' => $request->volunteer_needed ?? 0,
            'status'           => 'upcoming',
        ]);

        AuditLog::record('event.created', $event, [], $event->toArray());

        return response()->json(['message' => 'Event created', 'event' => $event->load('program')], 201);
    }

    public function show(Event $event): JsonResponse
    {
        return response()->json($event->load(['program', 'volunteerAssignments.volunteer.user', 'attendance']));
    }

    public function update(Request $request, Event $event): JsonResponse
    {
        $old = $event->toArray();
        $event->update($request->only(['title', 'description', 'location', 'start_datetime', 'end_datetime', 'volunteer_needed', 'status']));
        AuditLog::record('event.updated', $event, $old, $event->toArray());
        return response()->json(['message' => 'Event updated', 'event' => $event]);
    }

    public function destroy(Event $event): JsonResponse
    {
        AuditLog::record('event.deleted', $event, $event->toArray());
        $event->delete();
        return response()->json(['message' => 'Event deleted']);
    }

    public function assignVolunteer(Request $request, Event $event): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'volunteer_id' => 'required|exists:volunteers,id',
            'tasks'        => 'nullable|string',
            'notes'        => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $assignment = EventVolunteer::updateOrCreate(
            ['event_id' => $event->id, 'volunteer_id' => $request->volunteer_id],
            ['status' => 'assigned', 'tasks' => $request->tasks, 'notes' => $request->notes]
        );

        AuditLog::record('event.volunteer_assigned', $event, [], ['volunteer_id' => $request->volunteer_id]);

        return response()->json(['message' => 'Volunteer assigned', 'assignment' => $assignment->load('volunteer.user')], 201);
    }

    public function upcoming(Request $request): JsonResponse
    {
        $events = Event::where('organization_id', $request->user()->organization_id)
            ->where('status', 'upcoming')
            ->where('start_datetime', '>=', now())
            ->with(['program'])
            ->withCount('volunteerAssignments')
            ->orderBy('start_datetime')
            ->take(5)
            ->get();

        return response()->json($events);
    }
}
