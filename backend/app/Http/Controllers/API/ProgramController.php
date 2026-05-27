<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\Event;
use App\Models\EventVolunteer;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ProgramController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Program::with(['organization'])
            ->withCount(['events', 'donations'])
            ->where('organization_id', $request->user()->organization_id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        return response()->json($query->latest()->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'             => 'required|string|max:255',
            'description'      => 'nullable|string',
            'objectives'       => 'nullable|string',
            'budget'           => 'nullable|numeric|min:0',
            'start_date'       => 'nullable|date',
            'end_date'         => 'nullable|date|after:start_date',
            'location'         => 'nullable|string',
            'volunteer_target' => 'nullable|integer|min:0',
            'status'           => 'nullable|in:draft,active,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $program = Program::create([
            'organization_id' => $request->user()->organization_id,
            'name'            => $request->name,
            'slug'            => Str::slug($request->name) . '-' . Str::random(6),
            'description'     => $request->description,
            'objectives'      => $request->objectives,
            'budget'          => $request->budget ?? 0,
            'start_date'      => $request->start_date,
            'end_date'        => $request->end_date,
            'location'        => $request->location,
            'volunteer_target'=> $request->volunteer_target ?? 0,
            'status'          => $request->input('status', 'draft'), // use admin's chosen status
        ]);

        if ($request->hasFile('banner_image')) {
            $path = $request->file('banner_image')->store('programs', 'public');
            $program->update(['banner_image' => $path]);
        }

        AuditLog::record('program.created', $program, [], $program->toArray());

        return response()->json(['message' => 'Program created', 'program' => $program], 201);
    }

    public function show(Program $program): JsonResponse
    {
        return response()->json($program->load(['events.volunteerAssignments', 'donations', 'expenses']));
    }

    public function update(Request $request, Program $program): JsonResponse
    {
        $old = $program->toArray();
        $program->update($request->only(['name', 'description', 'objectives', 'budget', 'status', 'start_date', 'end_date', 'location', 'volunteer_target']));
        AuditLog::record('program.updated', $program, $old, $program->toArray());
        return response()->json(['message' => 'Program updated', 'program' => $program]);
    }

    public function destroy(Program $program): JsonResponse
    {
        AuditLog::record('program.deleted', $program, $program->toArray());
        $program->delete();
        return response()->json(['message' => 'Program deleted']);
    }

    public function stats(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;

        $programs = Program::where('organization_id', $orgId)
            ->withSum('donations', 'amount')
            ->withSum('expenses', 'amount')
            ->withCount('events')
            ->get()
            ->map(function ($p) {
                $budget       = (float) $p->budget;
                $donationsSum = (float) ($p->donations_sum_amount ?? 0);
                $expensesSum  = (float) ($p->expenses_sum_amount ?? 0);
                return [
                    'id'               => $p->id,
                    'name'             => $p->name,
                    'budget'           => $budget,
                    'donations_total'  => $donationsSum,
                    'expenses_total'   => $expensesSum,
                    'events_count'     => (int) $p->events_count,
                    'status'           => $p->status,
                    'utilization'      => $budget > 0 ? round(($expensesSum / $budget) * 100, 1) : 0,
                ];
            });

        return response()->json(['programs' => $programs]);
    }
}

