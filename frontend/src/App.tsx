import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import VolunteersPage from '@/pages/volunteers/VolunteersPage';
import DonorsPage from '@/pages/donors/DonorsPage';
import DonationsPage from '@/pages/donations/DonationsPage';
import ProgramsPage from '@/pages/programs/ProgramsPage';
import EventsPage from '@/pages/events/EventsPage';
import AssignmentsPage from '@/pages/assignments/AssignmentsPage';
import ExpensesPage from '@/pages/expenses/ExpensesPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import CertificatesPage from '@/pages/certificates/CertificatesPage';
import AnnouncementsPage from '@/pages/announcements/AnnouncementsPage';
import AuditLogsPage from '@/pages/audit-logs/AuditLogsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import PublicHomePage from '@/pages/public/HomePage';
import PublicProgramsPage from '@/pages/public/ProgramsPage';
import DonatePage from '@/pages/public/DonatePage';
import VolunteerPage from '@/pages/public/VolunteerPage';
import ContactPage from '@/pages/public/ContactPage';
import ErrorBoundary from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/Badge';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
});

/** Full-page loading spinner */
function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-500">Loading One World One Family...</p>
      </div>
    </div>
  );
}

/**
 * AdminRoute — only accessible by staff roles.
 * Volunteers/donors who try to visit an admin URL get redirected to /programs.
 * Unauthenticated users get redirected to /login.
 */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth();
  if (isLoading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/programs" replace />;
  return (
    <AppLayout>
      <ErrorBoundary>{children}</ErrorBoundary>
    </AppLayout>
  );
}

/**
 * GuestRoute — only for logged-out users.
 * After login, everyone lands on the public home page.
 */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

/**
 * UserRedirect — always shows the public home page at "/".
 * Admins can navigate to /dashboard via the nav bar.
 */
function UserRedirect() {
  const { isLoading } = useAuth();
  if (isLoading) return <FullPageLoader />;
  return <PublicHomePage />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ─── Public routes (no auth required) ─── */}
      <Route path="/" element={<UserRedirect />} />
      <Route path="/about"    element={<PublicHomePage />} />
      <Route path="/programs" element={<PublicProgramsPage />} />
      <Route path="/donate"   element={<DonatePage />} />
      <Route path="/volunteer" element={<VolunteerPage />} />
      <Route path="/contact"  element={<ContactPage />} />

      {/* ─── Auth routes (redirect if already logged in) ─── */}
      <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* ─── Admin-only routes ─── */}
      <Route path="/dashboard"    element={<AdminRoute><DashboardPage /></AdminRoute>} />
      <Route path="/volunteers"   element={<AdminRoute><VolunteersPage /></AdminRoute>} />
      <Route path="/donors"       element={<AdminRoute><DonorsPage /></AdminRoute>} />
      <Route path="/donations"    element={<AdminRoute><DonationsPage /></AdminRoute>} />
      <Route path="/programs-admin" element={<AdminRoute><ProgramsPage /></AdminRoute>} />
      <Route path="/events"       element={<AdminRoute><EventsPage /></AdminRoute>} />
      <Route path="/assignments"  element={<AdminRoute><AssignmentsPage /></AdminRoute>} />
      <Route path="/expenses"     element={<AdminRoute><ExpensesPage /></AdminRoute>} />
      <Route path="/reports"      element={<AdminRoute><ReportsPage /></AdminRoute>} />
      <Route path="/certificates" element={<AdminRoute><CertificatesPage /></AdminRoute>} />
      <Route path="/announcements" element={<AdminRoute><AnnouncementsPage /></AdminRoute>} />
      <Route path="/audit-logs"   element={<AdminRoute><AuditLogsPage /></AdminRoute>} />
      <Route path="/settings"     element={<AdminRoute><SettingsPage /></AdminRoute>} />
      <Route path="/profile"      element={<AdminRoute><ProfilePage /></AdminRoute>} />

      {/* ─── Catch-all ─── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
