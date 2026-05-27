import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { StatCard, Skeleton, EmptyState } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatDateTime, getStatusColor, cn } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Users, Heart, DollarSign, TrendingUp, FolderOpen, Clock,
  Calendar, Activity, ArrowUpRight, ArrowDownRight, Wallet
} from 'lucide-react';
import type { DashboardStats, Event, Donation, AuditLog } from '@/types';

interface DashboardData {
  stats: DashboardStats;
  donation_trend: Array<{ month: string; amount: number; count: number }>;
  volunteer_trend: Array<{ month: string; count: number }>;
  program_utilization: Array<{ name: string; budget: number; spent: number; remaining: number }>;
  upcoming_events: Event[];
  recent_donations: Donation[];
  recent_activities: AuditLog[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard');
      return res.data;
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-xl border border-gray-200">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Volunteers"
          value={Number(stats?.total_volunteers ?? 0).toLocaleString()}
          change={`${Number(stats?.active_volunteers ?? 0)} active`}
          changeType="positive"
          icon={<Users className="w-5 h-5" />}
          iconColor="bg-rose-100 text-rose-600"
        />
        <StatCard
          title="Total Donations"
          value={formatCurrency(Number(stats?.total_donations ?? 0))}
          change={`${formatCurrency(Number(stats?.monthly_donations ?? 0))} this month`}
          changeType="positive"
          icon={<DollarSign className="w-5 h-5" />}
          iconColor="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Active Programs"
          value={Number(stats?.active_programs ?? 0)}
          change={`${Number(stats?.total_programs ?? 0)} total`}
          changeType="neutral"
          icon={<FolderOpen className="w-5 h-5" />}
          iconColor="bg-purple-100 text-purple-600"
        />
        <StatCard
          title="Volunteer Hours"
          value={`${Number(stats?.volunteer_hours ?? 0).toFixed(0)}`}
          subtitle="Total hours logged"
          icon={<Clock className="w-5 h-5" />}
          iconColor="bg-amber-100 text-amber-600"
        />
        <StatCard
          title="Total Donors"
          value={Number(stats?.total_donors ?? 0)}
          icon={<Heart className="w-5 h-5" />}
          iconColor="bg-rose-100 text-rose-600"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(Number(stats?.total_expenses ?? 0))}
          icon={<Wallet className="w-5 h-5" />}
          iconColor="bg-orange-100 text-orange-600"
        />
        <StatCard
          title="Net Funds"
          value={formatCurrency(Number(stats?.net_funds ?? 0))}
          change={Number(stats?.net_funds ?? 0) > 0 ? 'Surplus' : 'Deficit'}
          changeType={Number(stats?.net_funds ?? 0) > 0 ? 'positive' : 'negative'}
          icon={<TrendingUp className="w-5 h-5" />}
          iconColor="bg-teal-100 text-teal-600"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(Number(stats?.monthly_donations ?? 0))}
          change="Donations received"
          changeType="positive"
          icon={<ArrowUpRight className="w-5 h-5" />}
          iconColor="bg-rose-100 text-rose-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donation Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Donation Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data?.donation_trend}>
                <defs>
                  <linearGradient id="donationGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: 12 }}
                  formatter={(v) => [formatCurrency(Number(v)), 'Amount']}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#donationGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Volunteer Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Volunteer Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data?.volunteer_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: 12 }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Program Utilization & Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Program Fund Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Program Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.program_utilization && data.program_utilization.length > 0 ? (
              <div className="space-y-4">
                {data.program_utilization.map((prog, i) => {
                  const pct = prog.budget > 0 ? Math.min(100, Math.round((prog.spent / prog.budget) * 100)) : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700 truncate">{prog.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-1000',
                            pct > 90 ? 'bg-rose-500' : pct > 70 ? 'bg-amber-500' : 'bg-rose-500'
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-400">{formatCurrency(prog.spent)} spent</span>
                        <span className="text-xs text-gray-400">{formatCurrency(prog.budget)} budget</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No programs" description="Create programs to see utilization" icon={<FolderOpen />} />
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data?.upcoming_events && data.upcoming_events.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {data.upcoming_events.map((event) => (
                  <div key={event.id} className="px-6 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-100 flex flex-col items-center justify-center">
                        <span className="text-xs font-bold text-purple-700 leading-none">
                          {new Date(event.start_datetime).getDate()}
                        </span>
                        <span className="text-xs text-purple-500 leading-none">
                          {new Date(event.start_datetime).toLocaleString('default', { month: 'short' })}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                        <p className="text-xs text-gray-500">{event.location}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{event.volunteer_needed} needed</span>
                        </div>
                      </div>
                      <Badge variant="status" status={event.status}>
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No upcoming events" icon={<Calendar />} />
            )}
          </CardContent>
        </Card>

        {/* Recent Donations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Donations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data?.recent_donations && data.recent_donations.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {data.recent_donations.map((donation) => (
                  <div key={donation.id} className="px-6 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {donation.is_anonymous ? 'Anonymous' : donation.donor_profile?.name}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(donation.donation_date)}</p>
                        <p className="text-xs text-gray-400 truncate">{donation.program?.name}</p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-sm font-semibold text-rose-600">{formatCurrency(donation.amount)}</p>
                        <Badge variant="status" status={donation.status}>
                          {donation.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No donations yet" icon={<DollarSign />} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data?.recent_activities && data.recent_activities.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {data.recent_activities.map((log) => (
                <div key={log.id} className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{log.user?.name || 'System'}</span>
                      {' · '}
                      <span className="text-gray-600">{(log.action || '').replace('.', ' ').replace('_', ' ')}</span>
                    </p>
                    <p className="text-xs text-gray-400">{log.ip_address}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatDateTime(log.created_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No recent activity" icon={<Activity />} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
