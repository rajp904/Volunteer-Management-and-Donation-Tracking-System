<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CertificateController extends Controller
{
    public function index(Request $request)
    {
        $query = Certificate::with('volunteer.user')
            ->where('organization_id', $request->user()->organization_id);

        if ($request->search) {
            $query->whereHas('volunteer.user', function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%");
            })->orWhere('certificate_number', 'like', "%{$request->search}%")
              ->orWhere('title', 'like', "%{$request->search}%");
        }

        return response()->json($query->latest()->paginate(15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'volunteer_id' => 'required|exists:volunteers,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'hours_completed' => 'nullable|numeric|min:0',
            'issue_date' => 'required|date',
        ]);

        $validated['organization_id'] = $request->user()->organization_id;
        $validated['certificate_number'] = 'CERT-' . strtoupper(Str::random(8));

        $cert = Certificate::create($validated);

        return response()->json($cert->load('volunteer.user'), 201);
    }

    public function show(Certificate $certificate)
    {
        return response()->json($certificate->load('volunteer.user'));
    }

    public function destroy(Certificate $certificate)
    {
        $certificate->delete();
        return response()->json(null, 204);
    }
}
