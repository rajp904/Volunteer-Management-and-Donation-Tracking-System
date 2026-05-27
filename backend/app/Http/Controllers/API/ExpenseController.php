<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Expense::with(['program', 'user'])
            ->where('organization_id', $request->user()->organization_id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('program_id')) {
            $query->where('program_id', $request->program_id);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('expense_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('expense_date', '<=', $request->to_date);
        }

        return response()->json($query->latest('expense_date')->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0.01',
            'category' => 'required|in:rent,utilities,salaries,materials,transport,food,marketing,equipment,other',
            'expense_date' => 'required|date',
            'program_id' => 'nullable|exists:programs,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $expense = Expense::create([
            'organization_id' => $request->user()->organization_id,
            'user_id' => $request->user()->id,
            'program_id' => $request->program_id,
            'title' => $request->title,
            'description' => $request->description,
            'amount' => $request->amount,
            'category' => $request->category,
            'expense_date' => $request->expense_date,
            'status' => 'pending',
        ]);

        if ($request->hasFile('bill_attachment')) {
            $path = $request->file('bill_attachment')->store('expenses', 'public');
            $expense->update(['bill_attachment' => $path]);
        }

        AuditLog::record('expense.created', $expense, [], $expense->toArray());

        return response()->json(['message' => 'Expense recorded', 'expense' => $expense->load('program', 'user')], 201);
    }

    public function show(Expense $expense): JsonResponse
    {
        return response()->json($expense->load(['program', 'user']));
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $old = $expense->toArray();
        $expense->update($request->only(['title', 'description', 'amount', 'category', 'expense_date', 'program_id', 'status']));

        if ($request->status === 'approved') {
            $expense->update([
                'approved_by' => $request->user()->name,
                'approved_at' => now(),
            ]);
        }

        AuditLog::record('expense.updated', $expense, $old, $expense->toArray());
        return response()->json(['message' => 'Expense updated', 'expense' => $expense->load('program', 'user')]);
    }

    public function destroy(Expense $expense): JsonResponse
    {
        AuditLog::record('expense.deleted', $expense, $expense->toArray());
        $expense->delete();
        return response()->json(['message' => 'Expense deleted']);
    }

    public function stats(Request $request): JsonResponse
    {
        $orgId = $request->user()->organization_id;

        $totalExpenses   = (float) (string) Expense::where('organization_id', $orgId)->where('status', 'approved')->sum('amount');
        $pendingExpenses = (float) (string) Expense::where('organization_id', $orgId)->where('status', 'pending')->sum('amount');

        $byCategory = Expense::where('organization_id', $orgId)
            ->where('status', 'approved')
            ->selectRaw('category, sum(amount) as total, count(*) as count')
            ->groupBy('category')
            ->get()
            ->map(fn($r) => [
                'category' => $r->category,
                'total'    => (float) (string) $r->total,
                'count'    => (int)   $r->count,
            ]);

        $byProgram = Expense::where('organization_id', $orgId)
            ->where('status', 'approved')
            ->with('program:id,name')
            ->selectRaw('program_id, sum(amount) as total')
            ->groupBy('program_id')
            ->get()
            ->map(fn($r) => [
                'program_id' => $r->program_id,
                'program'    => $r->program,
                'total'      => (float) (string) $r->total,
            ]);

        return response()->json([
            'total_approved' => $totalExpenses,
            'total_pending'  => $pendingExpenses,
            'by_category'    => $byCategory,
            'by_program'     => $byProgram,
        ]);
    }
}
