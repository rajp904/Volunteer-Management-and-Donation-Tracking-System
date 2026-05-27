import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Badge, EmptyState, Skeleton } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatCurrency, getInitials, cn } from '@/lib/utils';
import { Heart, Plus, Search, MoreHorizontal, Eye, X, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DonorProfile, PaginatedResponse } from '@/types';
import { validateName, validateEmail, validatePhone, validatePAN } from '@/lib/validation';

const DONOR_TYPES = ['individual', 'corporate', 'trust', 'government', 'ngo', 'other'] as const;

const defaultForm = {
  name: '',
  email: '',
  phone: '',
  donor_type: 'individual' as DonorProfile['donor_type'],
  is_anonymous: false,
  is_recurring: false,
  address: '',
  city: '',
  pan_number: '',
  notes: '',
};

const donorTypeColors: Record<string, string> = {
  individual: 'bg-blue-100 text-blue-700',
  corporate: 'bg-purple-100 text-purple-700',
  trust: 'bg-amber-100 text-amber-700',
  government: 'bg-rose-100 text-rose-700',
  ngo: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function DonorsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editDonor, setEditDonor] = useState<DonorProfile | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<DonorProfile | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<DonorProfile>>({
    queryKey: ['donors', search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', page.toString());
      const res = await api.get(`/donors?${params}`);
      return res.data;
    },
  });

  const openCreate = () => {
    setEditDonor(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (donor: DonorProfile) => {
    setEditDonor(donor);
    setForm({
      name: donor.name,
      email: donor.email ?? '',
      phone: donor.phone ?? '',
      donor_type: donor.donor_type,
      is_anonymous: donor.is_anonymous,
      is_recurring: donor.is_recurring,
      address: (donor as any).address ?? '',
      city: (donor as any).city ?? '',
      pan_number: (donor as any).pan_number ?? '',
      notes: (donor as any).notes ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditDonor(null);
    setForm(defaultForm);
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/donors', data),
    onSuccess: () => {
      toast.success('Donor added successfully');
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to add donor'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) => api.put(`/donors/${id}`, data),
    onSuccess: () => {
      toast.success('Donor updated successfully');
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update donor'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/donors/${id}`),
    onSuccess: () => {
      toast.success('Donor deleted');
      queryClient.invalidateQueries({ queryKey: ['donors'] });
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Failed to delete donor'),
  });

  const handleSubmit = () => {
    // ── Strict client-side validation ──────────────────────────────────────
    const nameErr = validateName(form.name);
    if (nameErr) { toast.error(nameErr); return; }
    if (form.email) {
      const emailErr = validateEmail(form.email);
      if (emailErr) { toast.error(emailErr); return; }
    }
    if (form.phone) {
      const phoneErr = validatePhone(form.phone);
      if (phoneErr) { toast.error(phoneErr); return; }
    }
    if (form.pan_number) {
      const panErr = validatePAN(form.pan_number);
      if (panErr) { toast.error(panErr); return; }
    }
    // ───────────────────────────────────────────────────────────────────
    if (editDonor) {
      updateMutation.mutate({ id: editDonor.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donors</h1>
          <p className="text-sm text-gray-500">Manage donor relationships and profiles</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> Add Donor</Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search donors..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
          id="donor-search"
        />
      </div>

      {/* Donors Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((donor) => (
            <div key={donor.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-200">
              <div className="flex items-start gap-3 mb-4">
                {donor.is_anonymous ? (
                  <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500 text-xl flex-shrink-0">
                    🔒
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {getInitials(donor.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{donor.is_anonymous ? 'Anonymous' : donor.name}</h3>
                  {donor.email && !donor.is_anonymous && (
                    <p className="text-xs text-gray-500 truncate">{donor.email}</p>
                  )}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${donorTypeColors[donor.donor_type] || 'bg-gray-100 text-gray-700'}`}>
                    {donor.donor_type}
                  </span>
                </div>
                {donor.is_recurring && (
                  <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                    Recurring
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Total Donated</p>
                  <p className="text-base font-bold text-rose-600">{formatCurrency(donor.total_donated)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Donations</p>
                  <p className="text-base font-bold text-gray-900">{donor.donations_count ?? 0}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(donor)}>
                  <Edit2 className="w-4 h-4" /> Edit
                </Button>
                <button
                  onClick={() => setDeleteConfirm(donor)}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-rose-50 hover:border-rose-200 text-gray-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No donors found" description="Add donors to track your fundraising relationships." icon={<Heart />} action={<Button size="sm" onClick={openCreate}><Plus /> Add Donor</Button>} />
      )}

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {((page - 1) * data.per_page) + 1}–{Math.min(page * data.per_page, data.total)} of {data.total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === data.last_page} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{editDonor ? 'Edit Donor' : 'Add Donor'}</h2>
                  <p className="text-xs text-gray-500">{editDonor ? 'Update donor profile' : 'Create a new donor profile'}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name / Organization <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="donor-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="donor-email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="donor-phone"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Donor Type</label>
                  <select
                    value={form.donor_type}
                    onChange={(e) => setForm(f => ({ ...f, donor_type: e.target.value as DonorProfile['donor_type'] }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="donor-type"
                  >
                    {DONOR_TYPES.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="Hyderabad"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="donor-city"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">PAN Number</label>
                <input
                  type="text"
                  value={form.pan_number}
                  onChange={(e) => setForm(f => ({ ...f, pan_number: e.target.value.toUpperCase() }))}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase"
                  id="donor-pan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  id="donor-notes"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_anonymous}
                    onChange={(e) => setForm(f => ({ ...f, is_anonymous: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                    id="donor-anonymous"
                  />
                  <span className="text-sm text-gray-700">Anonymous donor</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_recurring}
                    onChange={(e) => setForm(f => ({ ...f, is_recurring: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                    id="donor-recurring"
                  />
                  <span className="text-sm text-gray-700">Recurring donor</span>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-gray-100 px-6 py-4 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
              <Button className="flex-1" disabled={isPending} onClick={handleSubmit}>
                {isPending ? (editDonor ? 'Updating...' : 'Adding...') : (editDonor ? 'Update Donor' : 'Add Donor')}
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
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Donor</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete <strong>"{deleteConfirm.name}"</strong>? This cannot be undone.
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
