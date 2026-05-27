import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState, Skeleton } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDate, getInitials, cn } from '@/lib/utils';
import {
  Award, Plus, Search, Download, Eye, Trash2,
  CheckCircle, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import type { Certificate, PaginatedResponse } from '@/types';

export default function CertificatesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [form, setForm] = useState({
    volunteer_id: '',
    title: 'Volunteer Appreciation Certificate',
    description: '',
    hours_completed: '',
    issue_date: new Date().toISOString().split('T')[0],
  });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginatedResponse<Certificate>>({
    queryKey: ['certificates', search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', page.toString());
      const res = await api.get(`/certificates?${params}`);
      return res.data;
    },
  });

  const { data: volunteers } = useQuery({
    queryKey: ['volunteers-list'],
    queryFn: async () => { const r = await api.get('/volunteers?per_page=200'); return r.data?.data ?? []; },
  });

  const issueMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/certificates', data),
    onSuccess: () => {
      toast.success('Certificate issued successfully!');
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      setShowIssueModal(false);
      setForm({ volunteer_id: '', title: 'Volunteer Appreciation Certificate', description: '', hours_completed: '', issue_date: new Date().toISOString().split('T')[0] });
    },
    onError: () => toast.error('Failed to issue certificate'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/certificates/${id}`),
    onSuccess: () => {
      toast.success('Certificate deleted');
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
    onError: () => toast.error('Failed to delete certificate'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Issue and manage volunteer appreciation certificates</p>
        </div>
        <Button size="sm" onClick={() => setShowIssueModal(true)}>
          <Plus className="w-4 h-4" /> Issue Certificate
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search certificates..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          id="cert-search"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((cert) => (
            <div key={cert.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
              {/* Certificate header */}
              <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                <div className="relative">
                  <Award className="w-8 h-8 text-white mb-2" />
                  <h3 className="text-sm font-bold text-white leading-tight">{cert.title}</h3>
                  <p className="text-xs text-amber-100 font-mono mt-1">#{cert.certificate_number}</p>
                </div>
              </div>

              <div className="p-4">
                {cert.volunteer && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {getInitials(cert.volunteer?.user?.name || 'V')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{cert.volunteer?.user?.name}</p>
                      <p className="text-xs text-gray-500">{cert.volunteer?.volunteer_id}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {cert.hours_completed}h completed
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-rose-500" />
                    {formatDate(cert.issue_date)}
                  </div>
                </div>

                {cert.description && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{cert.description}</p>
                )}

                <div className="flex gap-2">
                  {cert.file_path && (
                    <a
                      href={cert.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium hover:bg-rose-100 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('Delete this certificate?')) deleteMutation.mutate(cert.id);
                    }}
                    className="p-2 rounded-xl border border-gray-200 hover:bg-rose-50 hover:text-rose-600 text-gray-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No certificates issued"
          description="Issue appreciation certificates to recognize volunteer contributions."
          icon={<Award />}
          action={<Button size="sm" onClick={() => setShowIssueModal(true)}><Plus className="w-4 h-4" /> Issue Certificate</Button>}
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

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Issue Certificate</h2>
                <p className="text-sm text-gray-500">Recognize a volunteer's contribution</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Volunteer</label>
                <select
                  value={form.volunteer_id}
                  onChange={(e) => setForm(f => ({ ...f, volunteer_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="cert-volunteer"
                >
                  <option value="">Select volunteer...</option>
                  {(volunteers || []).map((v: any) => (
                    <option key={v.id} value={v.id}>{v.user?.name} ({v.volunteer_id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Certificate Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  id="cert-title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="In recognition of dedicated service..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  id="cert-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Hours Completed</label>
                  <input
                    type="number"
                    value={form.hours_completed}
                    onChange={(e) => setForm(f => ({ ...f, hours_completed: e.target.value }))}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="cert-hours"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Issue Date</label>
                  <input
                    type="date"
                    value={form.issue_date}
                    onChange={(e) => setForm(f => ({ ...f, issue_date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    id="cert-date"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowIssueModal(false)}>Cancel</Button>
              <Button
                className="flex-1"
                disabled={!form.volunteer_id || !form.title || issueMutation.isPending}
                onClick={() => issueMutation.mutate(form)}
              >
                {issueMutation.isPending ? 'Issuing...' : 'Issue Certificate'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
