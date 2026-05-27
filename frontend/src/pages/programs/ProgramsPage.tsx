import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Badge, EmptyState, Skeleton } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { FolderOpen, Plus, Search, Edit2, Trash2, X, MapPin, Heart, HandHeart } from 'lucide-react';
import { toast } from 'sonner';
import type { Program, PaginatedResponse } from '@/types';

const defaultForm = {
  name: '',
  description: '',
  objectives: '',
  budget: '',
  location: '',
  start_date: '',
  end_date: '',
  volunteer_target: '',
  status: 'draft' as Program['status'],
};

export default function ProgramsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editProgram, setEditProgram] = useState<Program | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<Program | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Program>>({
    queryKey: ['programs', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      const res = await api.get(`/programs?${params}`);
      return res.data;
    },
  });

  const openCreate = () => {
    setEditProgram(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (program: Program) => {
    setEditProgram(program);
    setForm({
      name: program.name,
      description: program.description ?? '',
      objectives: program.objectives ?? '',
      budget: String(program.budget),
      location: program.location ?? '',
      start_date: program.start_date ?? '',
      end_date: program.end_date ?? '',
      volunteer_target: String(program.volunteer_target),
      status: program.status,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditProgram(null);
    setForm(defaultForm);
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/programs', data),
    onSuccess: () => {
      toast.success('Program created successfully');
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create program'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) => api.put(`/programs/${id}`, data),
    onSuccess: () => {
      toast.success('Program updated successfully');
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update program'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/programs/${id}`),
    onSuccess: () => {
      toast.success('Program deleted');
      // Invalidate admin programs list
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      // Also invalidate public-facing pages so deleted program disappears immediately
      queryClient.invalidateQueries({ queryKey: ['public-programs'] });
      queryClient.invalidateQueries({ queryKey: ['public-stats'] });
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Failed to delete program'),
  });

  const handleSubmit = () => {
    if (!form.name) {
      toast.error('Program name is required');
      return;
    }
    if (editProgram) {
      updateMutation.mutate({ id: editProgram.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
          <p className="text-sm text-gray-500">Manage community programs and campaigns</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> Create Program</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search programs..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            id="program-search"
          />
        </div>
        {['', 'draft', 'active', 'completed', 'cancelled'].map((s) => (
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

      {/* Programs Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.data.map((program, idx) => {
            const pct = program.budget > 0 ? Math.min(100, Math.round((program.spent / program.budget) * 100)) : 0;
            const gradients = [
              'from-rose-500 via-pink-600 to-rose-700',
              'from-violet-500 via-purple-600 to-violet-700',
              'from-cyan-500 via-sky-600 to-cyan-700',
              'from-amber-500 via-orange-600 to-amber-700',
              'from-emerald-500 via-teal-600 to-emerald-700',
              'from-fuchsia-500 via-pink-600 to-fuchsia-700',
            ];
            const grad = gradients[idx % gradients.length];
            return (
              <div
                key={program.id}
                className="group relative flex flex-col rounded-3xl overflow-hidden"
                style={{
                  background: '#ffffff',
                  border: '1px solid #f1f5f9',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-6px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 50px rgba(225,29,72,0.15)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.07)';
                }}
              >
                {/* Gradient header */}
                <div className={`bg-gradient-to-br ${grad} p-6 relative overflow-hidden`}>
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-black/10" />
                  <div className="relative flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <FolderOpen className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/20 text-white border border-white/30 capitalize tracking-wide">
                      ● {program.status}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-extrabold text-white leading-tight drop-shadow">
                    {program.name}
                  </h3>
                  {program.location && (
                    <div className="flex items-center gap-1.5 mt-2 text-white/80 text-xs font-medium">
                      <MapPin className="w-3 h-3" /> {program.location}
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="flex flex-col flex-1 p-6 gap-4">
                  {program.description && (
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{program.description}</p>
                  )}

                  {/* Funding progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-400 font-medium">Fundraising Progress</span>
                      <span className="text-xs font-bold text-gray-700">{pct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-700`}
                        style={{ width: `${pct}%`, boxShadow: '0 0 8px 1px rgba(225,29,72,0.35)' }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-gray-400">Raised: <span className="text-gray-700 font-semibold">{formatCurrency(program.spent)}</span></span>
                      <span className="text-xs text-gray-400">Goal: <span className="text-gray-700 font-semibold">{formatCurrency(program.budget)}</span></span>
                    </div>
                  </div>

                  {/* Meta stats */}
                  <div className="grid grid-cols-3 gap-3 py-3 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900">{program.events_count ?? 0}</p>
                      <p className="text-xs text-gray-400">Events</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900">{program.volunteer_target ?? 0}</p>
                      <p className="text-xs text-gray-400">Vol. Target</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900">{program.donations_count ?? 0}</p>
                      <p className="text-xs text-gray-400">Donors</p>
                    </div>
                  </div>

                  {(program.start_date || program.end_date) && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 -mt-2">
                      {program.start_date && <span>{formatDate(program.start_date)}</span>}
                      {program.end_date && <span>→ {formatDate(program.end_date)}</span>}
                    </div>
                  )}

                  {/* Admin actions */}
                  <div className="flex gap-2 mt-auto pt-1">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(program)}>
                      <Edit2 className="w-4 h-4" /> Edit
                    </Button>
                    <button
                      onClick={() => setDeleteConfirm(program)}
                      className="p-2 rounded-xl border border-gray-200 hover:bg-rose-50 hover:border-rose-200 text-gray-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No programs found" description="Create your first program to start organizing your community work." icon={<FolderOpen />} action={<Button size="sm" onClick={openCreate}><Plus /> Create Program</Button>} />
      )}

      {/* Pagination */}
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
                  <FolderOpen className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{editProgram ? 'Edit Program' : 'Create Program'}</h2>
                  <p className="text-xs text-gray-500">{editProgram ? 'Update program details' : 'Start a new community program'}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Program Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Clean Water Initiative"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="program-name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the program's purpose and impact..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  id="program-description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Objectives</label>
                <textarea
                  value={form.objectives}
                  onChange={(e) => setForm(f => ({ ...f, objectives: e.target.value }))}
                  placeholder="List the key objectives..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  id="program-objectives"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Budget (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.budget}
                    onChange={(e) => setForm(f => ({ ...f, budget: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="program-budget"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Volunteer Target</label>
                  <input
                    type="number"
                    min="0"
                    value={form.volunteer_target}
                    onChange={(e) => setForm(f => ({ ...f, volunteer_target: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="program-volunteer-target"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Telangana, India"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="program-location"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="program-start-date"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="program-end-date"
                  />
                </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value as Program['status'] }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="program-status"
                  >
                    {['draft', 'active', 'completed', 'cancelled'].map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                    ⚠️ Only <strong>Active</strong> and <strong>Completed</strong> programs appear on the public home page.
                  </p>
                </div>
            </div>

            <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-gray-100 px-6 py-4 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
              <Button className="flex-1" disabled={isPending} onClick={handleSubmit}>
                {isPending ? (editProgram ? 'Updating...' : 'Creating...') : (editProgram ? 'Update Program' : 'Create Program')}
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
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Program</h2>
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
