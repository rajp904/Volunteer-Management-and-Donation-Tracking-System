import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn, getInitials } from '@/lib/utils';
import {
  LayoutDashboard, Users, Heart, DollarSign, FolderOpen, Calendar,
  Receipt, FileText, Activity, Settings,
  LogOut, Bell, Search, Menu, X, ChevronDown, Building2,
  UserCheck
} from 'lucide-react';

const navItems = [
  { href: '/dashboard',      label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/volunteers',     label: 'Volunteers', icon: Users },
  { href: '/donors',         label: 'Donors',     icon: Heart },
  { href: '/donations',      label: 'Donations',  icon: DollarSign },
  { href: '/programs-admin', label: 'Programs',   icon: FolderOpen },
  { href: '/events',         label: 'Events',     icon: Calendar },
  { href: '/expenses',       label: 'Expenses',   icon: Receipt },
  { href: '/reports',        label: 'Reports',    icon: FileText },
  { href: '/audit-logs',     label: 'Audit Logs', icon: Activity },
  { href: '/settings',       label: 'Settings',   icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

  return (
    <div className="min-h-screen bg-rose-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-gradient-to-b from-rose-50 to-white border-r border-rose-100 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-rose-100 gap-3 flex-shrink-0 bg-rose-50">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          {sidebarOpen && (
            <div>
              <span className="font-bold text-gray-900 text-sm leading-tight block">One World One Family</span>
              <span className="text-xs text-gray-500 leading-tight block">NGO Management</span>
            </div>
          )}
        </div>

        {/* Organization */}
        {sidebarOpen && user?.organization && (
          <div className="px-4 py-3 border-b border-rose-100 bg-rose-50/60">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center">
                <Building2 className="w-3 h-3 text-rose-600" />
              </div>
              <span className="text-xs font-medium text-gray-600 truncate">{user.organization.name}</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                title={!sidebarOpen ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-rose-50 text-rose-700 border border-rose-100'
                    : 'text-gray-600 hover:bg-rose-50 hover:text-rose-700',
                  !sidebarOpen && 'justify-center'
                )}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-rose-600' : '')} />
                {sidebarOpen && <span>{item.label}</span>}
                {sidebarOpen && active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-rose-100 bg-rose-50/50">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {getInitials(user?.name || 'U')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.roles?.[0]?.name}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-rose-50 flex items-center justify-center text-gray-400 hover:text-rose-600 transition-colors mx-auto"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className={cn('flex-1 flex flex-col min-h-screen transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-16')}>
        {/* Top bar */}
        <header className="h-16 bg-white/80 border-b border-rose-100 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-rose-100 text-gray-500 hover:text-rose-600 transition-colors"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-rose-200 text-sm bg-rose-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-300 transition-all placeholder:text-rose-300"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button className="relative p-2 rounded-xl hover:bg-rose-100 text-rose-400 hover:text-rose-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-xs font-semibold">
                  {getInitials(user?.name || 'U')}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.roles?.[0]?.name}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-rose-100 shadow-lg shadow-rose-100 py-1 z-50">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <UserCheck className="w-4 h-4" /> Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 w-full"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 page-transition">
          {children}
        </main>
      </div>
    </div>
  );
}
