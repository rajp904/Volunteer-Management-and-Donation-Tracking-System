import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge, Skeleton, EmptyState } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate, formatHours, getInitials, cn } from '@/lib/utils';
import {
  Users, Plus, Search, Clock,
  CheckCircle, XCircle, AlertCircle, Download, Eye, Edit2, Trash2, X
} from 'lucide-react';
import type { Volunteer, PaginatedResponse } from '@/types';
import { toast } from 'sonner';

const statusConfig = {
  active:    { label: 'Active',    icon: CheckCircle, color: 'text-rose-600' },
  inactive:  { label: 'Inactive',  icon: XCircle,     color: 'text-gray-500' },
  pending:   { label: 'Pending',   icon: AlertCircle, color: 'text-amber-600' },
  suspended: { label: 'Suspended', icon: XCircle,     color: 'text-rose-600' },
};

const BG_STATUSES = ['not_started', 'in_progress', 'cleared', 'failed'] as const;

const defaultForm = {
  // User fields
  name: '',
  email: '',
  phone: '',
  // Volunteer fields
  skills: '',
  interests: '',
  notes: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relation: '',
  status: 'active' as Volunteer['status'],
  background_check_status: 'not_started' as typeof BG_STATUSES[number],
  joined_date: new Date().toISOString().slice(0, 10),
};

export default function VolunteersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editVolunteer, setEditVolunteer] = useState<Volunteer | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<Volunteer | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Volunteer>>({
    queryKey: ['volunteers', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      const res = await api.get(`/volunteers?${params}`);
      return res.data;
    },
  });

  const { data: pendingData } = useQuery<PaginatedResponse<Volunteer>>({
    queryKey: ['volunteers-pending'],
    queryFn: async () => {
      const res = await api.get('/volunteers?status=pending&per_page=50');
      return res.data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['volunteer-stats'],
    queryFn: async () => (await api.get('/volunteers/stats')).data,
  });

  const openCreate = () => {
    setEditVolunteer(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (vol: Volunteer) => {
    setEditVolunteer(vol);
    setForm({
      name: vol.user?.name ?? '',
      email: vol.user?.email ?? '',
      phone: vol.user?.phone ?? '',
      skills: vol.skills ?? '',
      interests: vol.interests ?? '',
      notes: vol.notes ?? '',
      emergency_contact_name: vol.emergency_contact_name ?? '',
      emergency_contact_phone: vol.emergency_contact_phone ?? '',
      emergency_contact_relation: vol.emergency_contact_relation ?? '',
      status: vol.status,
      background_check_status: (vol.background_check_status as typeof BG_STATUSES[number]) ?? 'not_started',
      joined_date: vol.joined_date?.slice(0, 10) ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditVolunteer(null);
    setForm(defaultForm);
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/volunteers', data),
    onSuccess: () => {
      toast.success('Volunteer added successfully');
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-stats'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to add volunteer'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) =>
      api.put(`/volunteers/${id}`, data),
    onSuccess: () => {
      toast.success('Volunteer updated successfully');
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-stats'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update volunteer'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/volunteers/${id}`),
    onSuccess: () => {
      toast.success('Volunteer removed');
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-stats'] });
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Failed to remove volunteer'),
  });

  const handleSubmit = () => {
    if (!form.name || !form.email) {
      toast.error('Name and email are required');
      return;
    }
    if (editVolunteer) {
      updateMutation.mutate({ id: editVolunteer.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleStatus = async (volunteerId: number, newStatus: 'active' | 'inactive') => {
    setActionLoading(volunteerId);
    try {
      await api.patch(`/volunteers/${volunteerId}/status`, { status: newStatus });
      toast.success(
        newStatus === 'active'
          ? '✅ Application Approved! Volunteer has been notified.'
          : '❌ Application Rejected. Volunteer has been notified.'
      );
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
      queryClient.invalidateQueries({ queryKey: ['volunteers-pending'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-stats'] });
    } catch {
      toast.error('Failed to update status. Try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const pendingList = pendingData?.data ?? [];

  const statCards = [
    { label: 'Total Volunteers', value: Number(statsData?.total ?? 0),        color: 'bg-blue-50 text-blue-700',   icon: Users },
    { label: 'Active',           value: Number(statsData?.active ?? 0),        color: 'bg-rose-50 text-rose-700',   icon: CheckCircle },
    { label: 'Pending',          value: Number(statsData?.pending ?? 0),       color: 'bg-amber-50 text-amber-700', icon: AlertCircle },
    { label: 'Total Hours',      value: `${Number(statsData?.total_hours ?? 0).toFixed(0)}h`, color: 'bg-purple-50 text-purple-700', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Volunteers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track all volunteers in your organization</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm"><Download className="w-4 h-4" /> Export</Button>
          <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> Add Volunteer</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={cn('rounded-2xl p-4 flex items-center gap-3', stat.color)}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="text-2xl font-bold leading-none mb-0.5">{stat.value}</p>
                <p className="text-xs opacity-70">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending Applications Panel */}
      {pendingList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="w-5 h-5" />
              Pending Applications
              <span className="ml-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingList.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-amber-100 bg-amber-50/50">
                    {['Applicant', 'Skills', 'Availability', 'Applied', 'Notes', 'Action'].map((h, i) => (
                      <th key={h} className={`text-xs font-semibold text-amber-700 uppercase tracking-wide px-6 py-3 ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {pendingList.map((vol) => (
                    <tr key={vol.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {getInitials(vol.user?.name || 'V')}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{vol.user?.name}</p>
                            <p className="text-xs text-gray-500">{vol.user?.email}</p>
                            {vol.user?.phone && <p className="text-xs text-gray-400">{vol.user?.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-600 max-w-[160px] line-clamp-2">{vol.skills || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-600">{vol.interests || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-500">{formatDate(vol.joined_date ?? vol.created_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-600 max-w-[180px] line-clamp-2">{vol.notes || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStatus(vol.id, 'active')}
                            disabled={actionLoading === vol.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            {actionLoading === vol.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleStatus(vol.id, 'inactive')}
                            disabled={actionLoading === vol.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-xs font-semibold transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            {actionLoading === vol.id ? '...' : 'Reject'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 flex-wrap">
        <div className="flex-1 relative min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            id="volunteer-search"
          />
        </div>
        <div className="flex items-center gap-2">
          {['', 'active', 'pending', 'inactive', 'suspended'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-medium transition-colors',
                statusFilter === s ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Volunteers Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Volunteer', 'ID', 'Status', 'Hours', 'Joined', 'Verification', 'Actions'].map((h, i) => (
                  <th key={h} className={`text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4 ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.data && data.data.length > 0 ? (
                data.data.map((volunteer) => {
                  const StatusIcon = statusConfig[volunteer.status]?.icon ?? CheckCircle;
                  return (
                    <tr key={volunteer.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {getInitials(volunteer.user?.name || 'V')}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{volunteer.user?.name}</p>
                            <p className="text-xs text-gray-500">{volunteer.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded-lg text-gray-600">
                          {volunteer.volunteer_id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="status" status={volunteer.status}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {volunteer.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-700">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {formatHours(volunteer.total_hours)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {volunteer.joined_date ? formatDate(volunteer.joined_date) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="status" status={volunteer.background_check_status || 'not_started'}>
                          {(volunteer.background_check_status || 'not_started').replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(volunteer)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(volunteer)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title="No volunteers found"
                      description="Add volunteers to your organization to see them here."
                      icon={<Users />}
                      action={<Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> Add Volunteer</Button>}
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
            <div className="flex items-center gap-2">
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
                  <Users className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {editVolunteer ? 'Edit Volunteer' : 'Add Volunteer'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {editVolunteer ? 'Update volunteer profile' : 'Register a new volunteer'}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Personal Info */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Personal Information</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Priya Krishnan"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      id="vol-name"
                      disabled={!!editVolunteer}
                    />
                    {editVolunteer && <p className="text-xs text-gray-400 mt-1">Name is managed via user account</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-rose-500">*</span></label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="email@example.com"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        id="vol-email"
                        disabled={!!editVolunteer}
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
                        id="vol-phone"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Volunteer Details */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Volunteer Details</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Skills</label>
                    <input
                      type="text"
                      value={form.skills}
                      onChange={(e) => setForm(f => ({ ...f, skills: e.target.value }))}
                      placeholder="e.g. First Aid, Teaching, Cooking"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      id="vol-skills"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Availability / Interests</label>
                    <input
                      type="text"
                      value={form.interests}
                      onChange={(e) => setForm(f => ({ ...f, interests: e.target.value }))}
                      placeholder="e.g. Weekends, Education, Healthcare"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      id="vol-interests"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm(f => ({ ...f, status: e.target.value as Volunteer['status'] }))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        id="vol-status"
                      >
                        {(['active', 'inactive', 'pending', 'suspended'] as const).map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Joined Date</label>
                      <input
                        type="date"
                        value={form.joined_date}
                        onChange={(e) => setForm(f => ({ ...f, joined_date: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                        id="vol-joined"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Background Check</label>
                    <select
                      value={form.background_check_status}
                      onChange={(e) => setForm(f => ({ ...f, background_check_status: e.target.value as typeof BG_STATUSES[number] }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      id="vol-bgcheck"
                    >
                      {BG_STATUSES.map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Any additional notes..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                      id="vol-notes"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Emergency Contact</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Name</label>
                    <input
                      type="text"
                      value={form.emergency_contact_name}
                      onChange={(e) => setForm(f => ({ ...f, emergency_contact_name: e.target.value }))}
                      placeholder="e.g. Ravi Kumar"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      id="vol-ec-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Phone</label>
                    <input
                      type="tel"
                      value={form.emergency_contact_phone}
                      onChange={(e) => setForm(f => ({ ...f, emergency_contact_phone: e.target.value }))}
                      placeholder="+91 9876543210"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      id="vol-ec-phone"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Relation</label>
                    <input
                      type="text"
                      value={form.emergency_contact_relation}
                      onChange={(e) => setForm(f => ({ ...f, emergency_contact_relation: e.target.value }))}
                      placeholder="e.g. Parent, Spouse, Sibling"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      id="vol-ec-relation"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-gray-100 px-6 py-4 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
              <Button className="flex-1" disabled={isPending} onClick={handleSubmit}>
                {isPending
                  ? (editVolunteer ? 'Updating...' : 'Adding...')
                  : (editVolunteer ? 'Update Volunteer' : 'Add Volunteer')}
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
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Remove Volunteer</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to remove{' '}
              <strong>"{deleteConfirm.user?.name}"</strong> from the system? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button
                className="flex-1 bg-rose-600 hover:bg-rose-700"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
              >
                {deleteMutation.isPending ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
