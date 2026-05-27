<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    public function volunteerHoursReport(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;
        // Simplified report data
        $data = \App\Models\Volunteer::where('organization_id', $orgId)
            ->with(['user:id,name,email'])
            ->get()
            ->map(fn($v) => [
                'volunteer_id' => $v->volunteer_id,
                'name'         => $v->user->name ?? 'N/A',
                'email'        => $v->user->email ?? 'N/A',
                'total_hours'  => (float) $v->total_hours,
                'status'       => $v->status,
            ]);

        return response()->json(['data' => $data, 'generated_at' => now()->toIso8601String()]);
    }

    public function donationSummaryReport(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;

        $query = \App\Models\Donation::where('organization_id', $orgId)
            ->where('status', 'completed')
            ->with(['donorProfile:id,name,email,donor_type', 'program:id,name']);

        if ($request->filled('from_date')) {
            $query->whereDate('donation_date', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('donation_date', '<=', $request->to_date);
        }

        $data = $query->get();

        return response()->json([
            'data'         => $data,
            'total'        => (float) $data->sum('amount'),
            'count'        => (int)   $data->count(),
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    public function programExpenditureReport(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;

        $programs = \App\Models\Program::where('organization_id', $orgId)
            ->with(['expenses' => function ($q) { $q->where('status', 'approved'); }])
            ->get()
            ->map(function ($p) {
                $budget       = (float) $p->budget;
                $totalExpenses = (float) $p->expenses->sum('amount');
                return [
                    'program'             => $p->name,
                    'budget'              => $budget,
                    'spent'               => $totalExpenses,
                    'remaining'           => $budget - $totalExpenses,
                    'utilization_percent' => $budget > 0 ? round(($totalExpenses / $budget) * 100, 1) : 0,
                    'expense_breakdown'   => $p->expenses->groupBy('category')->map(fn($items) => (float) $items->sum('amount')),
                ];
            });

        return response()->json(['data' => $programs, 'generated_at' => now()->toIso8601String()]);
    }

    public function auditLogsReport(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;

        $query = AuditLog::where('organization_id', $orgId)->with('user:id,name,email');

        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }
        if ($request->filled('action')) {
            $query->where('action', 'like', "%{$request->action}%");
        }

        return response()->json($query->latest()->paginate(50));
    }
}
