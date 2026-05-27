import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState, Skeleton } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDateTime, cn } from '@/lib/utils';
import {
  Megaphone, Plus, Search, Eye, Trash2, Bell,
  AlertTriangle, Info, Calendar, Users, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import type { Announcement, PaginatedResponse } from '@/types';

const typeConfig: Record<string, { color: string; icon: React.ElementType; bg: string }> = {
  general: { color: 'text-blue-700', bg: 'bg-blue-50', icon: Info },
  event: { color: 'text-purple-700', bg: 'bg-purple-50', icon: Calendar },
  urgent: { color: 'text-rose-700', bg: 'bg-rose-50', icon: AlertTriangle },
  program: { color: 'text-rose-700', bg: 'bg-rose-50', icon: Users },
};

export default function AnnouncementsPage() {
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [viewItem, setViewItem] = useState<Announcement | null>(null);
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'general',
    audience: 'all',
    is_published: true,
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Announcement>>({
    queryKey: ['announcements', typeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      params.set('page', page.toString());
      const res = await api.get(`/announcements?${params}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (d: typeof form) => api.post('/announcements', d),
    onSuccess: () => {
      toast.success('Announcement published!');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setShowModal(false);
      setForm({ title: '', content: '', type: 'general', audience: 'all', is_published: true });
    },
    onError: () => toast.error('Failed to create announcement'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/announcements/${id}`),
    onSuccess: () => {
      toast.success('Announcement deleted');
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-sm text-gray-500 mt-0.5">Broadcast news and updates to your community</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" /> New Announcement
        </Button>
      </div>

      {/* Type filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {['', 'general', 'event', 'urgent', 'program'].map((t) => (
          <button
            key={t}
            onClick={() => { setTypeFilter(t); setPage(1); }}
            className={cn('px-3 py-1.5 rounded-xl text-xs font-medium transition-colors',
              typeFilter === t ? 'bg-rose-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}
          >
            {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : data?.data && data.data.length > 0 ? (
        <div className="space-y-4">
          {data.data.map((ann) => {
            const cfg = typeConfig[ann.type] || typeConfig.general;
            const Icon = cfg.icon;
            return (
              <div key={ann.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 p-5">
                <div className="flex items-start gap-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
                    <Icon className={cn('w-5 h-5', cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base font-semibold text-gray-900">{ann.title}</h3>
                      <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize', cfg.bg, cfg.color)}>
                        {ann.type}
                      </span>
                      {!ann.is_published && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{ann.content}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>Audience: <strong className="text-gray-600 capitalize">{ann.audience}</strong></span>
                      {ann.published_at && <span>{formatDateTime(ann.published_at)}</span>}
                      {ann.user && <span>By {ann.user.name}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setViewItem(ann)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this announcement?')) deleteMutation.mutate(ann.id); }}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
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
        <EmptyState
          title="No announcements yet"
          description="Create announcements to keep volunteers and donors informed."
          icon={<Megaphone />}
          action={<Button size="sm" onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> New Announcement</Button>}
        />
      )}

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{((page - 1) * data.per_page) + 1}–{Math.min(page * data.per_page, data.total)} of {data.total}</p>
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

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">New Announcement</h2>
                <p className="text-sm text-gray-500">Broadcast to your community</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Announcement title..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="ann-title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={5}
                  placeholder="Write your announcement here..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  id="ann-content"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="ann-type"
                  >
                    <option value="general">General</option>
                    <option value="event">Event</option>
                    <option value="urgent">Urgent</option>
                    <option value="program">Program</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Audience</label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm(f => ({ ...f, audience: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="ann-audience"
                  >
                    <option value="all">All</option>
                    <option value="volunteers">Volunteers</option>
                    <option value="donors">Donors</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm(f => ({ ...f, is_published: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                  id="ann-publish"
                />
                <span className="text-sm text-gray-700">Publish immediately</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button
                className="flex-1"
                disabled={!form.title || !form.content || createMutation.isPending}
                onClick={() => createMutation.mutate(form)}
              >
                {createMutation.isPending ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setViewItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize',
                typeConfig[viewItem.type]?.bg, typeConfig[viewItem.type]?.color)}>
                {viewItem.type}
              </span>
              <button onClick={() => setViewItem(null)} className="text-gray-400 hover:text-gray-700 transition-colors text-xl leading-none">×</button>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{viewItem.title}</h2>
            <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{viewItem.content}</p>
            <div className="flex items-center gap-4 text-xs text-gray-400 pt-4 border-t border-gray-100">
              <span>Audience: <strong className="text-gray-600 capitalize">{viewItem.audience}</strong></span>
              {viewItem.published_at && <span>{formatDateTime(viewItem.published_at)}</span>}
              {viewItem.user && <span>By {viewItem.user.name}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
