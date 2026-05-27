import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Clock, Heart, Star, XCircle, X, Award, Users } from 'lucide-react';

interface VolStatus {
  found: boolean;
  status: 'pending' | 'active' | 'inactive' | 'suspended';
  volunteer_id: string;
  name: string;
  applied_at: string;
  notification: {
    type: 'approved' | 'rejected';
    message: string;
    read: boolean;
    date: string;
  } | null;
}

export default function VolunteerWelcomeBanner() {
  const { user } = useAuth();
  const [status, setStatus] = useState<VolStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user?.email) return;

    // Don't fetch for admins — only for regular users
    const adminRoles = ['super-admin', 'org-admin', 'coordinator', 'accountant', 'auditor'];
    const isAdmin = user.roles?.some(r => adminRoles.includes(r.name));
    if (isAdmin) return;

    // Check session storage — if already dismissed this session, stay hidden
    const key = `vol_banner_dismissed_${user.email}`;
    if (sessionStorage.getItem(key) === '1') {
      setDismissed(true);
      return;
    }

    fetch(`http://127.0.0.1:8000/api/public/volunteer-status?email=${encodeURIComponent(user.email)}`, {
      headers: { Accept: 'application/json' },
    })
      .then(r => r.json())
      .then(data => {
        if (data.found) setStatus(data);
      })
      .catch(() => {/* silently ignore */});
  }, [user?.email]);

  const handleDismiss = () => {
    setDismissed(true);
    if (user?.email) {
      sessionStorage.setItem(`vol_banner_dismissed_${user.email}`, '1');
    }
  };

  if (!user || !status || dismissed) return null;

  // ── Approved volunteer ──────────────────────────────────────────────────
  if (status.status === 'active') {
    return (
      <div className="relative overflow-hidden">
        {/* Animated gradient bg */}
        <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-rose-900 px-6 py-0">
          {/* Decorative blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute top-2 left-1/3 w-24 h-24 rounded-full bg-rose-500/20" />
            <div className="absolute -bottom-8 right-1/4 w-32 h-32 rounded-full bg-white/5" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: icon + message */}
            <div className="flex items-center gap-4">
              {/* Pulsing badge */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30">
                  <Heart className="w-7 h-7 text-white fill-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white font-extrabold text-lg leading-tight">
                    Welcome, {status.name}! 🎉
                  </span>
                  <span className="bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-xs font-bold px-2 py-0.5 rounded-full">
                    ✓ APPROVED
                  </span>
                </div>
                <p className="text-rose-100 text-sm leading-snug">
                  You are an official volunteer &amp; proud member of{' '}
                  <span className="text-white font-semibold">One World One Family</span> 🌍
                </p>
                <p className="text-rose-200/70 text-xs mt-0.5 font-mono">
                  Volunteer ID: {status.volunteer_id}
                </p>
              </div>
            </div>

            {/* Right: stat pills + dismiss */}
            <div className="flex items-center gap-3 flex-wrap justify-center md:justify-end">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2">
                <Award className="w-4 h-4 text-amber-300" />
                <span className="text-white text-xs font-semibold">Active Volunteer</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2">
                <Users className="w-4 h-4 text-rose-200" />
                <span className="text-white text-xs font-semibold">Member Since {new Date(status.applied_at).getFullYear()}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2">
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span className="text-white text-xs font-semibold">One World One Family</span>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/60 hover:text-white transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom shimmer line */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-rose-300/50 to-transparent" />
      </div>
    );
  }

  // ── Pending volunteer ───────────────────────────────────────────────────
  if (status.status === 'pending') {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Hi {status.name}, your volunteer application is under review!
              </p>
              <p className="text-xs text-amber-600">
                Our team will review your application shortly. You'll see this banner update once approved.
              </p>
            </div>
          </div>
          <button onClick={handleDismiss} className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-500 hover:text-amber-700 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ── Rejected volunteer ──────────────────────────────────────────────────
  if (status.status === 'inactive') {
    return (
      <div className="bg-red-50 border-b border-red-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-sm text-red-700">
              Hi {status.name}, your volunteer application was not approved at this time. You may{' '}
              <a href="/volunteer" className="font-semibold underline hover:text-red-800">reapply here</a>.
            </p>
          </div>
          <button onClick={handleDismiss} className="p-1.5 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
