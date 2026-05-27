import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Badge, EmptyState, Skeleton } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDateTime, cn } from '@/lib/utils';
import { Calendar, Plus, Search, MapPin, Users, Clock, ArrowRight, X, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Event, Program, PaginatedResponse } from '@/types';

const defaultForm = {
  program_id: '',
  title: '',
  description: '',
  location: '',
  start_datetime: '',
  end_datetime: '',
  volunteer_needed: '',
  status: 'upcoming' as Event['status'],
};

export default function EventsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<Event | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Event>>({
    queryKey: ['events', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', page.toString());
      const res = await api.get(`/events?${params}`);
      return res.data;
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
    setEditEvent(null);
    setForm(defaultForm);
    setShowModal(true);
  };

  const openEdit = (event: Event) => {
    setEditEvent(event);
    setForm({
      program_id: String(event.program_id),
      title: event.title,
      description: event.description ?? '',
      location: event.location ?? '',
      start_datetime: event.start_datetime?.slice(0, 16) ?? '',
      end_datetime: event.end_datetime?.slice(0, 16) ?? '',
      volunteer_needed: String(event.volunteer_needed),
      status: event.status,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditEvent(null);
    setForm(defaultForm);
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/events', data),
    onSuccess: () => {
      toast.success('Event created successfully');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create event'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof form }) => api.put(`/events/${id}`, data),
    onSuccess: () => {
      toast.success('Event updated successfully');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to update event'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/events/${id}`),
    onSuccess: () => {
      toast.success('Event deleted');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setDeleteConfirm(null);
    },
    onError: () => toast.error('Failed to delete event'),
  });

  const handleSubmit = () => {
    if (!form.title || !form.start_datetime || !form.end_datetime || !form.program_id) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (editEvent) {
      updateMutation.mutate({ id: editEvent.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const statusColors: Record<string, string> = {
    upcoming: 'from-purple-500 to-purple-700',
    ongoing: 'from-blue-500 to-blue-700',
    completed: 'from-gray-400 to-gray-600',
    cancelled: 'from-rose-400 to-rose-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-sm text-gray-500">Schedule and manage volunteer events</p>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="w-4 h-4" /> Create Event</Button>
      </div>

      {/* Status filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {['', 'upcoming', 'ongoing', 'completed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium transition-colors',
              statusFilter === s ? 'bg-rose-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}
          >
            {s === '' ? 'All Events' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <div className="space-y-4">
          {data.data.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
              <div className="flex items-stretch">
                {/* Date sidebar */}
                <div className={cn('w-24 flex-shrink-0 bg-gradient-to-b flex flex-col items-center justify-center text-white p-4', statusColors[event.status] || 'from-gray-400 to-gray-600')}>
                  <span className="text-3xl font-bold leading-none">{new Date(event.start_datetime).getDate()}</span>
                  <span className="text-sm opacity-90">{new Date(event.start_datetime).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-xs opacity-75 mt-1">{new Date(event.start_datetime).getFullYear()}</span>
                </div>

                {/* Content */}
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-gray-900">{event.title}</h3>
                        <Badge variant="status" status={event.status}>{event.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-3 line-clamp-1">{event.description}</p>
                      <div className="flex items-center gap-4 flex-wrap">
                        {event.location && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {event.location}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {formatDateTime(event.start_datetime)}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          {event.volunteer_assignments_count ?? 0}/{event.volunteer_needed} volunteers
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">{event.program?.name}</span>
                      <button
                        onClick={() => openEdit(event)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(event)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No events found" description="Create events to start organizing volunteer activities." icon={<Calendar />} action={<Button size="sm" onClick={openCreate}><Plus /> Create Event</Button>} />
      )}

      {/* Pagination */}
      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((page - 1) * data.per_page) + 1}–{Math.min(page * data.per_page, data.total)} of {data.total}
          </p>
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
                  <Calendar className="w-4.5 h-4.5 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">{editEvent ? 'Edit Event' : 'Create Event'}</h2>
                  <p className="text-xs text-gray-500">{editEvent ? 'Update event details' : 'Schedule a new volunteer event'}</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Program <span className="text-rose-500">*</span></label>
                <select
                  value={form.program_id}
                  onChange={(e) => setForm(f => ({ ...f, program_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="event-program"
                >
                  <option value="">Select a program...</option>
                  {(programs ?? []).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Title <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Community Clean-up Drive"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="event-title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the event..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  id="event-description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. City Park, Hyderabad"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="event-location"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date & Time <span className="text-rose-500">*</span></label>
                  <input
                    type="datetime-local"
                    value={form.start_datetime}
                    onChange={(e) => setForm(f => ({ ...f, start_datetime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="event-start"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date & Time <span className="text-rose-500">*</span></label>
                  <input
                    type="datetime-local"
                    value={form.end_datetime}
                    onChange={(e) => setForm(f => ({ ...f, end_datetime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="event-end"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Volunteers Needed</label>
                  <input
                    type="number"
                    min="0"
                    value={form.volunteer_needed}
                    onChange={(e) => setForm(f => ({ ...f, volunteer_needed: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="event-volunteer-count"
                  />
                </div>
                {editEvent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm(f => ({ ...f, status: e.target.value as Event['status'] }))}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      id="event-status"
                    >
                      {['upcoming', 'ongoing', 'completed', 'cancelled'].map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white rounded-b-2xl border-t border-gray-100 px-6 py-4 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={closeModal}>Cancel</Button>
              <Button className="flex-1" disabled={isPending} onClick={handleSubmit}>
                {isPending ? (editEvent ? 'Updating...' : 'Creating...') : (editEvent ? 'Update Event' : 'Create Event')}
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
            <h2 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Event</h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>? This action cannot be undone.
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
