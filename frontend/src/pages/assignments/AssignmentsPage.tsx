import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge, EmptyState, Skeleton } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import {
  ClipboardList, Plus, Search, Users, Calendar, Check,
  X, Clock, ChevronLeft, ChevronRight, UserCheck, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Assignment {
  id: number;
  volunteer_id: number;
  event_id: number;
  role?: string;
  status: 'assigned' | 'confirmed' | 'attended' | 'absent' | 'cancelled';
  hours_logged?: number;
  feedback?: string;
  assigned_at: string;
  volunteer?: { id: number; user?: { name: string; email: string } };
  event?: { id: number; title: string; start_datetime: string; location?: string; program?: { name: string } };
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  assigned: { label: 'Assigned', color: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmed', color: 'bg-rose-100 text-rose-700' },
  attended: { label: 'Attended', color: 'bg-purple-100 text-purple-700' },
  absent: { label: 'Absent', color: 'bg-rose-100 text-rose-700' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500' },
};

export default function AssignmentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ volunteer_id: '', event_id: '', role: '' });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Assignment>>({
    queryKey: ['assignments', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      const res = await api.get(`/assignments?${params}`);
      return res.data;
    },
  });

  const { data: volunteers } = useQuery({
    queryKey: ['volunteers-list'],
    queryFn: async () => { const r = await api.get('/volunteers?per_page=100'); return r.data?.data ?? []; },
  });

  const { data: events } = useQuery({
    queryKey: ['events-list'],
    queryFn: async () => { const r = await api.get('/events?per_page=100'); return r.data?.data ?? []; },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/assignments', data),
    onSuccess: () => {
      toast.success('Assignment created successfully');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      setShowModal(false);
      setForm({ volunteer_id: '', event_id: '', role: '' });
    },
    onError: () => toast.error('Failed to create assignment'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/assignments/${id}`, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: () => toast.error('Failed to update status'),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage volunteer-event assignments</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> New Assignment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by volunteer or event..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            id="assignment-search"
          />
        </div>
        <div className="flex items-center gap-2">
          {['', 'assigned', 'confirmed', 'attended', 'absent', 'cancelled'].map((s) => (
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
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Volunteer', 'Event', 'Role', 'Status', 'Assigned', 'Hours', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">{h}</th>
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
                data.data.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {(a.volunteer?.user?.name || 'V').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{a.volunteer?.user?.name || `Volunteer #${a.volunteer_id}`}</p>
                          <p className="text-xs text-gray-500">{a.volunteer?.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">{a.event?.title || `Event #${a.event_id}`}</p>
                      {a.event?.start_datetime && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />{formatDateTime(a.event.start_datetime)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{a.role || <span className="text-gray-400 italic">General</span>}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusConfig[a.status]?.color)}>
                        {statusConfig[a.status]?.label || a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{formatDate(a.assigned_at)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">{a.hours_logged ? `${a.hours_logged}h` : '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        {a.status === 'assigned' && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: a.id, status: 'confirmed' })}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                            title="Confirm"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {(a.status === 'assigned' || a.status === 'confirmed') && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: a.id, status: 'cancelled' })}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      title="No assignments yet"
                      description="Assign volunteers to events to coordinate your team."
                      icon={<ClipboardList />}
                      action={<Button size="sm" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> New Assignment</Button>}
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
              {((page - 1) * data.per_page) + 1}–{Math.min(page * data.per_page, data.total)} of {data.total}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page === data.last_page} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">New Assignment</h2>
                <p className="text-sm text-gray-500">Assign a volunteer to an event</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Volunteer</label>
                <select
                  value={form.volunteer_id}
                  onChange={(e) => setForm(f => ({ ...f, volunteer_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="assign-volunteer"
                >
                  <option value="">Select a volunteer...</option>
                  {(volunteers || []).map((v: any) => (
                    <option key={v.id} value={v.id}>{v.user?.name} ({v.volunteer_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Event</label>
                <select
                  value={form.event_id}
                  onChange={(e) => setForm(f => ({ ...f, event_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="assign-event"
                >
                  <option value="">Select an event...</option>
                  {(events || []).map((ev: any) => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Role (optional)</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                  placeholder="e.g. Team Leader, Registration Desk"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="assign-role"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setShowModal(false); setForm({ volunteer_id: '', event_id: '', role: '' }); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!form.volunteer_id || !form.event_id || createMutation.isPending}
                onClick={() => createMutation.mutate(form)}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Assignment'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
