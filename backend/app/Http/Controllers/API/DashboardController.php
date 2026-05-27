<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Volunteer;
use App\Models\Donation;
use App\Models\Program;
use App\Models\Event;
use App\Models\Expense;
use App\Models\DonorProfile;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;

        $totalVolunteers = Volunteer::where('organization_id', $orgId)->count();
        $activeVolunteers = Volunteer::where('organization_id', $orgId)->where('status', 'active')->count();
        $totalDonations = (float) (string) Donation::where('organization_id', $orgId)->where('status', 'completed')->sum('amount');
        $monthlyDonations = (float) (string) Donation::where('organization_id', $orgId)
            ->where('status', 'completed')
            ->whereMonth('donation_date', now()->month)
            ->whereYear('donation_date', now()->year)
            ->sum('amount');
        $totalPrograms = (int) Program::where('organization_id', $orgId)->count();
        $activePrograms = (int) Program::where('organization_id', $orgId)->where('status', 'active')->count();
        $totalDonors = (int) DonorProfile::where('organization_id', $orgId)->count();
        $totalExpenses = (float) (string) Expense::where('organization_id', $orgId)->where('status', 'approved')->sum('amount');
        $volunteerHours = (float) (string) Volunteer::where('organization_id', $orgId)->sum('total_hours');

        $upcomingEvents = Event::where('organization_id', $orgId)
            ->where('status', 'upcoming')
            ->where('start_datetime', '>=', now())
            ->with(['program'])
            ->orderBy('start_datetime')
            ->take(5)
            ->get();

        $recentDonations = Donation::where('organization_id', $orgId)
            ->with(['donorProfile', 'program'])
            ->latest('donation_date')
            ->take(5)
            ->get();

        $recentActivities = AuditLog::where('organization_id', $orgId)
            ->with('user')
            ->latest()
            ->take(10)
            ->get();

        // Monthly donation trend (last 6 months)
        $donationTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $donationTrend[] = [
                'month' => $date->format('M'),
                'year' => $date->year,
                'amount' => (float) (string) Donation::where('organization_id', $orgId)
                    ->where('status', 'completed')
                    ->whereMonth('donation_date', $date->month)
                    ->whereYear('donation_date', $date->year)
                    ->sum('amount'),
                'count' => (int) Donation::where('organization_id', $orgId)
                    ->where('status', 'completed')
                    ->whereMonth('donation_date', $date->month)
                    ->whereYear('donation_date', $date->year)
                    ->count(),
            ];
        }

        // Volunteer growth trend (last 6 months)
        $volunteerTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $volunteerTrend[] = [
                'month' => $date->format('M'),
                'count' => Volunteer::where('organization_id', $orgId)
                    ->whereMonth('created_at', $date->month)
                    ->whereYear('created_at', $date->year)
                    ->count(),
            ];
        }

        // Program fund utilization
        $programUtilization = Program::where('organization_id', $orgId)
            ->where('status', 'active')
            ->withSum('expenses', 'amount')
            ->get()
            ->map(function ($program) {
                $budget = (float) $program->budget;
                $spent = (float) ($program->expenses_sum_amount ?? 0);
                return [
                    'name'      => $program->name,
                    'budget'    => $budget,
                    'spent'     => $spent,
                    'remaining' => $budget - $spent,
                ];
            });

        return response()->json([
            'stats' => [
                'total_volunteers'  => (int)   $totalVolunteers,
                'active_volunteers' => (int)   $activeVolunteers,
                'total_donations'   => (float) $totalDonations,
                'monthly_donations' => (float) $monthlyDonations,
                'total_programs'    => (int)   $totalPrograms,
                'active_programs'   => (int)   $activePrograms,
                'total_donors'      => (int)   $totalDonors,
                'total_expenses'    => (float) $totalExpenses,
                'volunteer_hours'   => (float) $volunteerHours,
                'net_funds'         => (float) ($totalDonations - $totalExpenses),
            ],
            'donation_trend' => $donationTrend,
            'volunteer_trend' => $volunteerTrend,
            'program_utilization' => $programUtilization,
            'upcoming_events' => $upcomingEvents,
            'recent_donations' => $recentDonations,
            'recent_activities' => $recentActivities,
        ]);
    }
}
