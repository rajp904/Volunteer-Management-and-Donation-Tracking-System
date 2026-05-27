import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, Skeleton, EmptyState } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  DollarSign, Plus, Search, Download, Receipt,
  TrendingUp, Users, Edit2, Trash2, X
} from 'lucide-react';
import { toast } from 'sonner';
import type { Donation, DonorProfile, Program, PaginatedResponse } from '@/types';

const DONATION_TYPES = ['cash', 'cheque', 'online', 'in_kind', 'bank_transfer', 'upi'] as const;
const DONATION_STATUSES = ['pending', 'completed', 'failed', 'refunded'] as const;

const defaultForm = {
  donor_profile_id: '',
  program_id: '',
  amount: '',
  donation_type: 'cash' as typeof DONATION_TYPES[number],
  status: 'completed' as typeof DONATION_STATUSES[number],
  donation_date: new Date().toISOString().slice(0, 10),
  purpose: '',
  notes: '',
  transaction_id: '',
  is_anonymous: false,
  is_tax_exempted: false,
};

const donationTypeIcons: Record<string, string> = {
  cash: '💵', cheque: '📋', online: '💳', in_kind: '📦', bank_transfer: '🏦', upi: '📱',
};

export default function DonationsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editDonation, setEditDonation] = useState<Donation | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<Donation | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Donation>>({
    queryKey: ['donations', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      const res = await api.get(`/donations?${params}`);
      return res.data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['donation-stats'],
    queryFn: async () => (await api.get('/donations/stats')).data,
  });

  const { data: donors } = useQuery<DonorProfile[]>({
    queryKey: ['donors-list'],
    queryFn: async () => {
      const res = await api.get('/donors?per_page=200');
      return res.data?.data ?? [];
    },
  });

  const { data: programs } = useQuery<Program[]>({
    queryKey: ['programs-list'],
    queryFn: async () => {
      const res = await api.get('/programs?per_page=100');
      return res.data?.data ?? [];
    },
  });

  const openCreate = () => {
    setEditDonation(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (donation: Donation) => {
    setEditDonation(donation);
    setForm({
      donor_profile_id: donation.donor_profile ? String((donation.donor_profile as any).id ?? '') : '',
      program_id: donation.program ? String((donation.program as any).id ?? '') : '',
      amount: String(donation.amount),
      donation_type: donation.donation_type,
      status: donation.status,
      donation_date: donation.donation_date?.slice(0, 10) ?? '',
      purpose: donation.purpose ?? '',
      notes: donation.notes ?? '',
      transaction_id: donation.transaction_id ?? '',
      is_anonymous: donation.is_anonymous,
      is_tax_exempted: donation.is_tax_exempted,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditDonation(null);
    setForm(defaultForm);
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/donations', data),
    onSuccess: () => {
      toast.success('Donation recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['donation-stats'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to record donation'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) =>
      api.put(`/donations/${id}`, data),
    onSuccess: () => {
      toast.success('Donation updated successfully');
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['donation-stats'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update donation'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/donations/${id}`),
    onSuccess: () => {
      toast.success('Donation deleted');
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['donation-stats'] });
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Failed to delete donation'),
  });

  const handleSubmit = () => {
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('A valid donation amount is required');
      return;
    }
    if (editDonation) {
      updateMutation.mutate({ id: editDonation.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donations</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage all donations received</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm"><Download className="w-4 h-4" /> Export</Button>
          <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> Record Donation</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-rose-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-rose-600" />
            <p className="text-xs text-rose-600 font-medium">Total Received</p>
          </div>
          <p className="text-xl font-bold text-rose-700">{formatCurrency(statsData?.total_amount ?? 0)}</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-blue-600 font-medium">This Month</p>
          </div>
          <p className="text-xl font-bold text-blue-700">{formatCurrency(statsData?.monthly_amount ?? 0)}</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-purple-600 font-medium">Total Receipts</p>
          </div>
          <p className="text-xl font-bold text-purple-700">{statsData?.total_count ?? 0}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-amber-600" />
            <p className="text-xs text-amber-600 font-medium">Avg. Donation</p>
          </div>
          <p className="text-xl font-bold text-amber-700">
            {statsData?.total_count
              ? formatCurrency((statsData.total_amount ?? 0) / statsData.total_count)
              : '₹0'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by donor or receipt..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            id="donation-search"
          />
        </div>
        <div className="flex items-center gap-2">
          {['', 'completed', 'pending', 'failed', 'refunded'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Receipt #', 'Donor', 'Amount', 'Type', 'Program', 'Transaction ID', 'Date', 'Status', 'Actions'].map((h) => (
                  <th key={h} className={`text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4 ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>)}</tr>
                ))
              ) : data?.data && data.data.length > 0 ? (
                data.data.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded-lg text-gray-600">
                        {donation.receipt_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {donation.is_anonymous ? '🔒 Anonymous' : (donation.donor_profile?.name ?? 'N/A')}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-rose-600">{formatCurrency(donation.amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {donationTypeIcons[donation.donation_type] ?? ''} {donation.donation_type?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 truncate max-w-[140px] block">
                        {donation.program?.name ?? 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {donation.transaction_id ? (
                        <span
                          className="font-mono text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-lg block truncate max-w-[160px]"
                          title={donation.transaction_id}
                        >
                          {donation.transaction_id}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formatDate(donation.donation_date)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="status" status={donation.status}>{donation.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(donation)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(donation)}
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
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      title="No donations found"
                      description="Record your first donation to get started."
                      icon={<DollarSign />}
                      action={<Button size="sm" onClick={openCreate}><Plus /> Record Donation</Button>}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.last_page > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {((page - 1) * data.per_page) + 1}–{Math.min(page * data.per_page, data.total)} of {data.total}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page === data.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {editDonation ? 'Edit Donation' : 'Record Donation'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {editDonation ? 'Update donation details' : 'Record a new donation'}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Donor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Donor</label>
                <select
                  value={form.donor_profile_id}
                  onChange={(e) => setForm(f => ({ ...f, donor_profile_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="donation-donor"
                  disabled={form.is_anonymous}
                >
                  <option value="">Select a donor...</option>
                  {(donors ?? []).map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.donor_id})</option>
                  ))}
                </select>
              </div>

              {/* Amount + Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (₹) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="donation-amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                  <select
                    value={form.donation_type}
                    onChange={(e) => setForm(f => ({ ...f, donation_type: e.target.value as typeof DONATION_TYPES[number] }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="donation-type"
                  >
                    {DONATION_TYPES.map(t => (
                      <option key={t} value={t}>{donationTypeIcons[t]} {t.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={form.donation_date}
                    onChange={(e) => setForm(f => ({ ...f, donation_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="donation-date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value as typeof DONATION_STATUSES[number] }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="donation-status"
                  >
                    {DONATION_STATUSES.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Program */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Program</label>
                <select
                  value={form.program_id}
                  onChange={(e) => setForm(f => ({ ...f, program_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="donation-program"
                >
                  <option value="">General (No specific program)</option>
                  {(programs ?? []).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Purpose</label>
                <input
                  type="text"
                  value={form.purpose}
                  onChange={(e) => setForm(f => ({ ...f, purpose: e.target.value }))}
                  placeholder="e.g. Education Fund"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="donation-purpose"
                />
              </div>

              {/* Transaction ID */}
              {['online', 'bank_transfer', 'upi', 'cheque'].includes(form.donation_type) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Transaction / Reference ID</label>
                  <input
                    type="text"
                    value={form.transaction_id}
                    onChange={(e) => setForm(f => ({ ...f, transaction_id: e.target.value }))}
                    placeholder="e.g. TXN123456789"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="donation-txnid"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  id="donation-notes"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_anonymous}
                    onChange={(e) => setForm(f => ({
                      ...f,
                      is_anonymous: e.target.checked,
                      donor_profile_id: e.target.checked ? '' : f.donor_profile_id,
                    }))}
                    className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                    id="donation-anonymous"
                  />
                  <span className="text-sm text-gray-700">Anonymous</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_tax_exempted}
                    onChange={(e) => setForm(f => ({ ...f, is_tax_exempted: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                    id="donation-tax"
                  />
                  <span className="text-sm text-gray-700">Tax Exempted (80G)</span>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-gray-100 px-6 py-4 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
              <Button className="flex-1" disabled={isPending} onClick={handleSubmit}>
                {isPending
                  ? (editDonation ? 'Updating...' : 'Recording...')
                  : (editDonation ? 'Update Donation' : 'Record Donation')}
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
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Donation</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete receipt{' '}
              <strong>#{deleteConfirm.receipt_number}</strong>? This cannot be undone.
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
