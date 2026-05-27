<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AnnouncementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $announcements = Announcement::where('organization_id', $request->user()->organization_id)
            ->with('user:id,name')
            ->latest()
            ->paginate(15);
        return response()->json($announcements);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'type' => 'nullable|in:general,event,urgent,program',
            'audience' => 'nullable|in:all,volunteers,donors,staff',
        ]);

        $announcement = Announcement::create([
            'organization_id' => $request->user()->organization_id,
            'user_id' => $request->user()->id,
            'title' => $request->title,
            'content' => $request->content,
            'type' => $request->type ?? 'general',
            'audience' => $request->audience ?? 'all',
            'is_published' => $request->is_published ?? false,
            'published_at' => $request->is_published ? now() : null,
        ]);

        return response()->json(['message' => 'Announcement created', 'announcement' => $announcement], 201);
    }

    public function show(Announcement $announcement): JsonResponse
    {
        return response()->json($announcement->load('user'));
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        $announcement->update($request->only(['title', 'content', 'type', 'audience', 'is_published']));
        if ($request->is_published && !$announcement->published_at) {
            $announcement->update(['published_at' => now()]);
        }
        return response()->json(['message' => 'Announcement updated', 'announcement' => $announcement]);
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        $announcement->delete();
        return response()->json(['message' => 'Announcement deleted']);
    }
}
