import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/Badge';
import { formatDateTime, cn } from '@/lib/utils';
import { Activity, User, Edit, Trash2, Plus, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useState } from 'react';
import type { AuditLog, PaginatedResponse } from '@/types';

const actionConfig: Record<string, { color: string; icon: React.ElementType; bg: string }> = {
  created: { color: 'text-rose-700', bg: 'bg-rose-50', icon: Plus },
  updated: { color: 'text-blue-700', bg: 'bg-blue-50', icon: Edit },
  deleted: { color: 'text-rose-700', bg: 'bg-rose-50', icon: Trash2 },
  viewed: { color: 'text-gray-700', bg: 'bg-gray-50', icon: Eye },
  login: { color: 'text-purple-700', bg: 'bg-purple-50', icon: User },
  logout: { color: 'text-amber-700', bg: 'bg-amber-50', icon: User },
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<PaginatedResponse<AuditLog>>({
    queryKey: ['audit-logs', search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('page', page.toString());
      const res = await api.get(`/audit-logs?${params}`);
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track all system activities and changes</p>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search logs..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          id="audit-search"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Action', 'User', 'Resource', 'IP Address', 'Time'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.data && data.data.length > 0 ? (
                data.data.map((log) => {
                  const cfg = actionConfig[log.action?.toLowerCase()] || actionConfig.viewed;
                  const Icon = cfg.icon;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg)}>
                            <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
                          </div>
                          <span className={cn('text-sm font-medium capitalize', cfg.color)}>{log.action}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                            {(log.user?.name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{log.user?.name || 'System'}</p>
                            <p className="text-xs text-gray-400">{log.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {log.model_type ? (
                          <div>
                            <p className="text-sm text-gray-700 font-medium">
                              {log.model_type.split('\\').pop()}
                            </p>
                            {log.model_id && (
                              <p className="text-xs text-gray-400">ID: {log.model_id}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-600">{log.ip_address || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{formatDateTime(log.created_at)}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Activity className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">No audit logs found</p>
                      <p className="text-xs text-gray-400">System activity will appear here</p>
                    </div>
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
      </div>
    </div>
  );
}
