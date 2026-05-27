import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Badge, EmptyState, Skeleton } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Receipt, Plus, Search, CheckCircle, Clock, XCircle, Download, Eye, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Expense, Program, PaginatedResponse } from '@/types';

const EXPENSE_CATEGORIES = ['materials', 'equipment', 'transport', 'food', 'marketing', 'salaries', 'utilities', 'rent', 'other'] as const;

const defaultForm = {
  title: '',
  description: '',
  amount: '',
  category: 'materials' as typeof EXPENSE_CATEGORIES[number],
  expense_date: new Date().toISOString().slice(0, 10),
  program_id: '',
  status: 'pending' as Expense['status'],
};

const categoryColors: Record<string, string> = {
  materials: 'bg-blue-100 text-blue-700',
  equipment: 'bg-purple-100 text-purple-700',
  transport: 'bg-amber-100 text-amber-700',
  food: 'bg-orange-100 text-orange-700',
  marketing: 'bg-pink-100 text-pink-700',
  salaries: 'bg-indigo-100 text-indigo-700',
  utilities: 'bg-teal-100 text-teal-700',
  rent: 'bg-gray-100 text-gray-700',
  other: 'bg-slate-100 text-slate-700',
};

export default function ExpensesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<Expense | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Expense>>({
    queryKey: ['expenses', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      const res = await api.get(`/expenses?${params}`);
      return res.data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['expense-stats'],
    queryFn: async () => (await api.get('/expenses/stats')).data,
  });

  const { data: programs } = useQuery<Program[]>({
    queryKey: ['programs-list'],
    queryFn: async () => {
      const res = await api.get('/programs?per_page=100');
      return res.data?.data ?? [];
    },
  });

  const openCreate = () => {
    setEditExpense(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (expense: Expense) => {
    setEditExpense(expense);
    setForm({
      title: expense.title,
      description: expense.description ?? '',
      amount: String(expense.amount),
      category: expense.category as typeof EXPENSE_CATEGORIES[number],
      expense_date: expense.expense_date?.slice(0, 10) ?? '',
      program_id: expense.program_id ? String(expense.program_id) : '',
      status: expense.status,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditExpense(null);
    setForm(defaultForm);
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/expenses', data),
    onSuccess: () => {
      toast.success('Expense added successfully');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to add expense'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) => api.put(`/expenses/${id}`, data),
    onSuccess: () => {
      toast.success('Expense updated successfully');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update expense'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      toast.success('Expense deleted');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Failed to delete expense'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.put(`/expenses/${id}`, { status: 'approved' }),
    onSuccess: () => {
      toast.success('Expense approved');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
    },
    onError: () => toast.error('Failed to approve expense'),
  });

  const handleSubmit = () => {
    if (!form.title || !form.amount) {
      toast.error('Title and amount are required');
      return;
    }
    if (editExpense) {
      updateMutation.mutate({ id: editExpense.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500">Track and manage operational expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="w-4 h-4" /> Export</Button>
          <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> Add Expense</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-rose-50 rounded-2xl p-4">
          <CheckCircle className="w-5 h-5 text-rose-600 mb-2" />
          <p className="text-xl font-bold text-rose-700">{formatCurrency(statsData?.total_approved ?? 0)}</p>
          <p className="text-xs text-rose-600">Approved Expenses</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4">
          <Clock className="w-5 h-5 text-amber-600 mb-2" />
          <p className="text-xl font-bold text-amber-700">{formatCurrency(statsData?.total_pending ?? 0)}</p>
          <p className="text-xs text-amber-600">Pending Approval</p>
        </div>
        <div className="bg-gray-50 rounded-2xl p-4">
          <Receipt className="w-5 h-5 text-gray-600 mb-2" />
          <p className="text-xl font-bold text-gray-700">{formatCurrency((statsData?.total_approved ?? 0) + (statsData?.total_pending ?? 0))}</p>
          <p className="text-xs text-gray-600">Total Expenses</p>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex items-center gap-2">
        {['', 'pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium transition-colors',
              statusFilter === s ? 'bg-rose-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Title</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Program</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Category</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Amount</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>)}</tr>
                ))
              ) : data?.data && data.data.length > 0 ? (
                data.data.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{expense.title}</p>
                      <p className="text-xs text-gray-500 truncate max-w-xs">{expense.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{expense.program?.name ?? 'General'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', categoryColors[expense.category] || 'bg-gray-100 text-gray-700')}>
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(expense.amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formatDate(expense.expense_date)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="status" status={expense.status}>{expense.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(expense)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {expense.status === 'pending' && (
                          <button
                            onClick={() => approveMutation.mutate(expense.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm(expense)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7}><EmptyState title="No expenses found" description="Add expenses to track your program costs." icon={<Receipt />} action={<Button size="sm" onClick={openCreate}><Plus /> Add Expense</Button>} /></td></tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.last_page > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {((page - 1) * data.per_page) + 1}–{Math.min(page * data.per_page, data.total)} of {data.total}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page === data.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{editExpense ? 'Edit Expense' : 'Add Expense'}</h2>
                  <p className="text-xs text-gray-500">{editExpense ? 'Update expense record' : 'Record a new expense'}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Event setup materials"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="expense-title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Add details about this expense..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  id="expense-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="expense-amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={form.expense_date}
                    onChange={(e) => setForm(f => ({ ...f, expense_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="expense-date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value as typeof EXPENSE_CATEGORIES[number] }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="expense-category"
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Program</label>
                  <select
                    value={form.program_id}
                    onChange={(e) => setForm(f => ({ ...f, program_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="expense-program"
                  >
                    <option value="">General (No program)</option>
                    {(programs ?? []).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {editExpense && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value as Expense['status'] }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="expense-status"
                  >
                    {['pending', 'approved', 'rejected'].map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-gray-100 px-6 py-4 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
              <Button className="flex-1" disabled={isPending} onClick={handleSubmit}>
                {isPending ? (editExpense ? 'Updating...' : 'Adding...') : (editExpense ? 'Update Expense' : 'Add Expense')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Expense</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button
                className="flex-1 bg-rose-600 hover:bg-rose-700"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
