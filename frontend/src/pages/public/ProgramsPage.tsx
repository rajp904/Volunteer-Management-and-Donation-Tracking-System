import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  Heart, FolderOpen, MapPin, Search, ArrowRight,
  ChevronRight, Globe, Phone, Mail, HandHeart
} from 'lucide-react';
import Button from '@/components/ui/Button';

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-rose-100 text-rose-700',
  completed: 'bg-gray-100 text-gray-600',
  draft:     'bg-amber-100 text-amber-700',
  paused:    'bg-rose-100 text-rose-700',
};

const PROGRAM_ICONS = ['🌱', '💧', '📚', '🏥', '🌍', '🤝', '🎓', '🍎'];

export default function PublicProgramsPage() {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  const { data: stats } = useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => (await api.get('/public/stats')).data,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: programs, isLoading } = useQuery({
    queryKey: ['public-programs'],
    queryFn: async () => (await api.get('/public/programs')).data,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const filtered = (programs ?? []).filter((p: { name: string; status: string }) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Navigation ── */}
      <nav className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">One World One Family</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Home',      to: '/' },
              { label: 'Programs',  to: '/programs' },
              { label: 'Donate',    to: '/donate' },
              { label: 'Volunteer', to: '/volunteer' },
              { label: 'Contact',   to: '/contact' },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  item.to === '/programs'
                    ? 'bg-rose-50 text-rose-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden sm:block text-sm text-gray-600 font-medium">
                  👋 Hi, {user.name?.split(' ')[0] ?? 'there'}
                </span>
                <button
                  onClick={() => logout()}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login"
                  className="px-4 py-1.5 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Sign in
                </Link>
                <Link 
                  to="/donate"
                  className="px-4 py-1.5 rounded-md bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors"
                >
                  Donate Now
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>



      {/* ── Hero Banner ── */}
      <section className="pt-24 pb-14 bg-gradient-to-br from-rose-600 via-rose-700 to-teal-800 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full bg-white/5" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-semibold mb-5 backdrop-blur-sm">
            <FolderOpen className="w-3.5 h-3.5" />
            Our Impact Programs
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            Programs Making a<br />
            <span className="text-rose-200">Real Difference</span>
          </h1>
          <p className="text-rose-100 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Discover the initiatives transforming lives across India. Every program is powered
            by compassionate volunteers and generous donors like you.
          </p>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { label: 'Volunteers',  value: Number(stats?.volunteers ?? 0).toLocaleString() },
              { label: 'Donations',   value: formatCurrency(Number(stats?.donations_total ?? 0)) },
              { label: 'Programs',    value: stats?.programs ?? 0 },
              { label: 'Donors',      value: stats?.donors ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-white">
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-rose-200">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filters ── */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search programs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent shadow-sm"
              id="program-search"
            />
          </div>
          {/* Status filters */}
          <div className="flex items-center gap-2">
            {['all', 'active', 'completed'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  statusFilter === s
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s === 'all' ? 'All Programs' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Programs Grid ── */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 mb-4" />
                <div className="h-5 bg-gray-100 rounded-lg w-3/4 mb-3" />
                <div className="h-4 bg-gray-100 rounded-lg w-full mb-2" />
                <div className="h-4 bg-gray-100 rounded-lg w-5/6 mb-4" />
                <div className="h-2 bg-gray-100 rounded-full mb-3" />
                <div className="h-9 bg-gray-100 rounded-xl mt-4" />
              </div>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-5">
              Showing <span className="font-semibold text-gray-800">{filtered.length}</span> program{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {filtered.map((prog: {
                id: number;
                name: string;
                description?: string;
                budget: number;
                spent?: number;
                location?: string;
                status: string;
                start_date?: string;
                end_date?: string;
                volunteer_target?: number;
              }, idx: number) => {
                const budget = Number(prog.budget ?? 0);
                const spent  = Number(prog.spent  ?? 0);
                const pct    = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
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
                    key={prog.id}
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
                    {/* Gradient header band */}
                    <div className={`bg-gradient-to-br ${grad} p-6 relative overflow-hidden`}>
                      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                      <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-black/10" />
                      <div className="relative flex items-start justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                          <FolderOpen className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/20 text-white border border-white/30 capitalize tracking-wide backdrop-blur-sm">
                          ● {prog.status}
                        </span>
                      </div>
                      <h3 className="mt-5 text-xl font-extrabold text-white leading-tight drop-shadow">
                        {prog.name}
                      </h3>
                      {prog.location && (
                        <div className="flex items-center gap-1.5 mt-2 text-white/80 text-xs font-medium">
                          <MapPin className="w-3 h-3" /> {prog.location}
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="flex flex-col flex-1 p-6 gap-4">
                      <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 flex-1">
                        {prog.description || 'Making a difference one step at a time in our communities.'}
                      </p>

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
                          <span className="text-xs text-gray-400">Raised: <span className="text-gray-700 font-semibold">{formatCurrency(spent)}</span></span>
                          <span className="text-xs text-gray-400">Goal: <span className="text-gray-700 font-semibold">{formatCurrency(budget)}</span></span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2.5 mt-auto pt-2">
                        <Link to={`/donate?program=${encodeURIComponent(prog.name)}&program_id=${prog.id}`} className="block">
                          <button className={`w-full py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r ${grad} hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-md flex items-center justify-center gap-2`}>
                            <Heart className="w-4 h-4 fill-white" />
                            Support This Program
                          </button>
                        </Link>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4 text-4xl">
              🔍
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No programs found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {search ? `No programs match "${search}"` : 'No programs in this category yet.'}
            </p>
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); }}
              className="text-sm text-rose-600 font-medium hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ── CTA Banner ── */}
      <section className="bg-gradient-to-br from-rose-600 to-teal-800 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Want to Make a Bigger Impact?</h2>
          <p className="text-rose-100 mb-8 max-w-xl mx-auto">
            Join as a volunteer or make a donation to support the programs that matter most to you.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register">
              <Button className="bg-white text-rose-700 hover:bg-rose-50 font-semibold" size="lg">
                Join as Volunteer <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/donate">
              <Button className="bg-rose-700 border border-rose-500 text-white hover:bg-rose-800" size="lg">
                Donate Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center">
                  <Heart className="w-3.5 h-3.5 text-white fill-white" />
                </div>
                <span className="font-bold">One World One Family</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Empowering communities through volunteer action and donor generosity since 2020.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Quick Links</h4>
              <div className="space-y-2">
                {[
                  { label: 'Home',     to: '/' },
                  { label: 'Programs', to: '/programs' },
                  { label: 'Donate',   to: '/donate' },
                  { label: 'Volunteer',to: '/volunteer' },
                ].map(({ label, to }) => (
                  <Link key={label} to={to} className="block text-sm text-gray-400 hover:text-white transition-colors">
                    <ChevronRight className="w-3 h-3 inline mr-1" />{label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Contact</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-400"><Mail className="w-4 h-4" /> admin@hopefoundation.org</div>
                <div className="flex items-center gap-2 text-sm text-gray-400"><Phone className="w-4 h-4" /> +91 98765 43210</div>
                <div className="flex items-center gap-2 text-sm text-gray-400"><Globe className="w-4 h-4" /> Hyderabad, Telangana, India</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} One World One Family. Built with ❤️ for NGOs worldwide.
          </div>
        </div>
      </footer>
    </div>
  );
}
