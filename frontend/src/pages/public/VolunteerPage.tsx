import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Heart, ArrowRight, CheckCircle, Bell, Search,
  Clock, XCircle, RefreshCw, Award, Star, Users, Shield, HandHeart, FolderOpen,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { validateName, validateEmail, validatePhone } from '@/lib/validation';

const skills = [
  'Teaching / Tutoring', 'Medical / Healthcare', 'Cooking / Food Distribution',
  'Counselling', 'Event Management', 'IT / Tech Support',
  'Photography / Media', 'Administrative Work', 'Disability Assistance',
  'Disaster Relief', 'Elderly Care', 'Other',
];
const availability = ['Weekdays', 'Weekends', 'Mornings', 'Evenings', 'Full-time', 'Flexible'];

const benefits = [
  { icon: '🤝', title: 'Make a Real Impact', desc: 'Directly touch the lives of thousands of underprivileged families.' },
  { icon: '🌱', title: 'Personal Growth', desc: 'Develop new skills, gain experience, and grow as a human being.' },
  { icon: '🏅', title: 'Recognition', desc: 'Receive certificates, awards, and official recognition for your service.' },
  { icon: '🌍', title: 'Join a Global Family', desc: 'Be part of a loving community that believes in One World, One Family.' },
];

interface ApplicationStatus {
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

function prettyDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ─────────────────────────────────────────────────────────────────────────────
   APPROVED VOLUNTEER CARD  — shown when the user is already an active volunteer
───────────────────────────────────────────────────────────────────────────── */
function ApprovedVolunteerCard({ volunteerName, volunteerId, joinedDate }: {
  volunteerName: string;
  volunteerId: string;
  joinedDate: string;
}) {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-rose-50 via-white to-rose-50 flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl w-full">
        {/* Confetti/celebration row */}
        <div className="flex justify-center gap-3 mb-6 text-3xl animate-bounce">
          <span>🎉</span><span>❤️</span><span>🌍</span><span>❤️</span><span>🎉</span>
        </div>

        {/* Main card */}
        <div className="relative bg-white rounded-3xl shadow-xl border border-rose-100 overflow-hidden">
          {/* Top gradient band */}
          <div className="bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 px-8 pt-10 pb-16 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-rose-500/20" />

            {/* Badge */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-emerald-400/20 border border-emerald-300/50 text-emerald-200 text-xs font-bold px-4 py-1.5 rounded-full mb-5">
                <CheckCircle className="w-3.5 h-3.5" />
                OFFICIAL VOLUNTEER · APPROVED
              </div>

              {/* Avatar circle */}
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm ring-4 ring-white/30 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-12 h-12 text-white fill-white" />
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
                Welcome, {volunteerName}! 🙏
              </h1>
              <p className="text-rose-100 text-base">
                You are now a proud volunteer &amp; member of
              </p>
              <p className="text-white font-extrabold text-xl mt-1 tracking-wide">
                One World One Family
              </p>
            </div>
          </div>

          {/* White body — pulled up to overlap gradient */}
          <div className="bg-white rounded-t-3xl -mt-8 relative z-10 px-8 pt-8 pb-10">
            {/* Volunteer ID pill */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-5 py-2.5">
                <Shield className="w-4 h-4 text-rose-500" />
                <span className="text-xs text-gray-500 font-medium">Volunteer ID</span>
                <span className="text-sm font-bold text-rose-700 font-mono">{volunteerId}</span>
              </div>
            </div>

            {/* Message */}
            <div className="text-center mb-8">
              <p className="text-gray-700 text-base leading-relaxed max-w-md mx-auto">
                Your application has been <span className="text-emerald-600 font-bold">approved</span> by our admin team.
                You are now an official member of our family, dedicated to making the world a better place! ❤️
              </p>
              <p className="text-gray-400 text-xs mt-2">Member since {prettyDate(joinedDate)}</p>
            </div>

            {/* Stat badges */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { icon: Award,  color: 'text-amber-500', label: 'Status',   value: 'Active Volunteer' },
                { icon: Users,  color: 'text-rose-500',  label: 'Community', value: 'One World Family'  },
                { icon: Star,   color: 'text-purple-500', label: 'Level',   value: 'Valued Member'      },
              ].map(({ icon: Icon, color, label, value }) => (
                <div key={label} className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
                  <Icon className={`w-5 h-5 ${color} mx-auto mb-1.5`} />
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-xs font-bold text-gray-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Quote */}
            <blockquote className="border-l-4 border-rose-400 pl-4 mb-8">
              <p className="text-rose-700 italic font-semibold text-sm">
                "Service to Man is Service to God."
              </p>
              <p className="text-rose-400 text-xs mt-1">— The foundation of One World One Family</p>
            </blockquote>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/programs"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl
                           bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800
                           text-white text-sm font-bold shadow-md shadow-rose-200 active:scale-[0.98] transition-all"
              >
                <Heart className="w-4 h-4 fill-white" />
                Explore Programs
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl
                           border-2 border-rose-200 text-rose-600 text-sm font-bold
                           hover:bg-rose-50 active:scale-[0.98] transition-all"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-gray-400 text-sm mt-6">
          🌍 Together we are <span className="text-rose-600 font-semibold">One World, One Family</span>
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN VOLUNTEER PAGE
───────────────────────────────────────────────────────────────────────────── */
export default function VolunteerPage() {
  const { user, isAdmin, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const programFromUrl = searchParams.get('program') || '';

  // Auto-detected volunteer status for logged-in user
  const [myVolStatus, setMyVolStatus] = useState<ApplicationStatus | null>(null);
  const [statusChecked, setStatusChecked] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '',
    skills: [] as string[], availability: [] as string[],
    message: programFromUrl ? `I would like to volunteer for the "${programFromUrl}" program.` : '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Status checker tab
  const [checkEmail, setCheckEmail] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [appStatus, setAppStatus] = useState<ApplicationStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'apply' | 'check'>('apply');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Auto-detect logged-in user's volunteer status ──────────────────────────
  useEffect(() => {
    if (!user?.email) { setStatusChecked(true); return; }
    const adminRoles = ['super-admin', 'org-admin', 'coordinator', 'accountant', 'auditor'];
    if (user.roles?.some(r => adminRoles.includes(r.name))) { setStatusChecked(true); return; }

    fetch(`http://127.0.0.1:8000/api/public/volunteer-status?email=${encodeURIComponent(user.email)}`, {
      headers: { Accept: 'application/json' },
    })
      .then(r => r.json())
      .then(data => { if (data.found) setMyVolStatus(data); })
      .catch(() => {})
      .finally(() => setStatusChecked(true));
  }, [user?.email]);

  // Pre-fill form with logged-in user's data
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name:  f.name  || user.name  || '',
        email: f.email || user.email || '',
        phone: f.phone || (user as { phone?: string }).phone || '',
      }));
    }
  }, [user?.email]);

  const toggleItem = (field: 'skills' | 'availability', val: string) => {
    setForm(f => ({ ...f, [field]: f[field].includes(val) ? f[field].filter(x => x !== val) : [...f[field], val] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Strict client-side validation ──────────────────────────────────────
    const errs: Record<string, string> = {};
    const nameErr = validateName(form.name);
    if (nameErr) errs.name = nameErr;
    const emailErr = validateEmail(form.email);
    if (emailErr) errs.email = emailErr;
    const phoneErr = validatePhone(form.phone, true);
    if (phoneErr) errs.phone = phoneErr;
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }
    setFormErrors({});
    // ────────────────────────────────────────────────────────────────────

    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://127.0.0.1:8000/api/public/volunteer-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        const msgs = data.errors ? Object.values(data.errors).flat().join(' ') : (data.message || 'Submission failed.');
        setError(msgs as string);
      } else if (data.status === 'active') {
        setMyVolStatus({ found: true, status: 'active', volunteer_id: data.id, name: form.name, applied_at: new Date().toISOString(), notification: null });
      } else if (data.status === 'pending') {
        setCheckEmail(form.email);
        setSubmitted(true);
        setActiveTab('check');
        checkStatus(form.email);
      } else {
        setSubmitted(true);
        setCheckEmail(form.email);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async (email?: string) => {
    const target = email ?? checkEmail;
    if (!target.trim()) { setCheckError('Please enter your email address.'); return; }
    setCheckLoading(true);
    setCheckError('');
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/public/volunteer-status?email=${encodeURIComponent(target.trim())}`, {
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) { setAppStatus(null); setCheckError(data.message || 'No application found for this email.'); }
      else {
        setAppStatus(data);
        // If newly approved, also update the auto-detected status
        if (data.status === 'active') setMyVolStatus(data);
      }
    } catch {
      setCheckError('Network error. Please try again.');
    } finally {
      setCheckLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'check' && appStatus?.status === 'pending' && checkEmail) {
      pollingRef.current = setInterval(() => checkStatus(checkEmail), 10000);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [activeTab, appStatus?.status, checkEmail]);

  useEffect(() => {
    if (submitted && form.email) {
      setActiveTab('check');
      setCheckEmail(form.email);
      checkStatus(form.email);
    }
  }, [submitted]);

  const statusInfo = {
    pending:   { icon: Clock,       color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'Pending Review'  },
    active:    { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Approved ✓'       },
    inactive:  { icon: XCircle,     color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200',     label: 'Not Approved'    },
    suspended: { icon: XCircle,     color: 'text-gray-600',    bg: 'bg-gray-50',    border: 'border-gray-200',    label: 'Suspended'       },
  };

  // ── If approved volunteer visits this page → show celebration card ─────────
  if (statusChecked && myVolStatus?.status === 'active') {
    return (
      <div className="min-h-screen bg-rose-50">
        {/* Navbar */}
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
                    item.to === '/volunteer'
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
                  {isAdmin() && (
                    <Link to="/dashboard" className="px-4 py-1.5 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-100 transition-colors">
                      Dashboard
                    </Link>
                  )}
                  <button onClick={() => logout()} className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-1.5 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-100 transition-colors">
                    Sign in
                  </Link>
                  <Link to="/donate" className="px-4 py-1.5 rounded-md bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors">
                    Donate Now
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        <ApprovedVolunteerCard
          volunteerName={myVolStatus.name || user?.name || 'Volunteer'}
          volunteerId={myVolStatus.volunteer_id}
          joinedDate={myVolStatus.applied_at}
        />
      </div>
    );
  }

  // ── Normal page (form + check status) ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-rose-50">
      {/* Navbar */}
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
                  item.to === '/volunteer'
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
                {isAdmin() && (
                  <Link to="/dashboard" className="px-4 py-1.5 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-100 transition-colors">
                    Dashboard
                  </Link>
                )}
                <button onClick={() => logout()} className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-1.5 rounded-md border border-gray-300 text-sm font-medium hover:bg-gray-100 transition-colors">
                  Sign in
                </Link>
                <Link to="/donate" className="px-4 py-1.5 rounded-md bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors">
                  Donate Now
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />

      {/* Hero */}
      <section className="bg-gradient-to-br from-rose-600 to-rose-800 text-white py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">
            <Heart className="w-4 h-4 fill-white" /> Join Our Volunteer Family
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Be the Change</h1>
          <p className="text-rose-100 text-lg max-w-xl mx-auto">
            "Service to Man is Service to God." — Join thousands of compassionate volunteers making a difference across India.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-14">
        {/* Tabs */}
        <div className="flex bg-white rounded-2xl border border-rose-100 shadow-sm p-1.5 w-fit mx-auto mb-10 gap-1">
          <button onClick={() => setActiveTab('apply')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'apply' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-600 hover:text-rose-600'}`}>
            <Heart className="w-4 h-4" /> Apply to Volunteer
          </button>
          <button onClick={() => setActiveTab('check')}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'check' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-600 hover:text-rose-600'}`}>
            <Bell className="w-4 h-4" /> Check Application Status
            {appStatus?.notification?.type === 'approved' && !appStatus.notification.read && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* ── APPLY TAB ── */}
        {activeTab === 'apply' && (
          submitted ? (
            <div className="text-center py-16 max-w-lg mx-auto">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Application Submitted! 🙏</h2>
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 border border-amber-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
                <Clock className="w-4 h-4" /> Pending Admin Approval
              </div>
              <p className="text-gray-600 text-base mb-4 max-w-md mx-auto">
                Thank you, <strong>{form.name}</strong>! Your application has been received and is awaiting admin review.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Use the <strong>"Check Application Status"</strong> tab to track using <strong>{form.email}</strong>.
              </p>
              <blockquote className="italic text-rose-600 font-semibold text-base mb-8">
                "The best way to find yourself is to lose yourself in the service of others."
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setActiveTab('check')}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors flex items-center gap-2">
                  <Bell className="w-4 h-4" /> Track My Application
                </button>
                <Link to="/" className="px-6 py-2.5 rounded-xl border border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-50 transition-colors flex items-center gap-2">
                  Back to Home <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Form */}
              <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-8">
                {/* Program context banner */}
                {programFromUrl && (
                  <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                      <p className="text-xs text-rose-500 font-semibold uppercase tracking-wide">Applying for Program</p>
                      <p className="text-sm font-bold text-rose-800">{programFromUrl}</p>
                    </div>
                    <HandHeart className="w-5 h-5 text-rose-400 ml-auto" />
                  </div>
                )}
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Volunteer Registration</h2>
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div>
                    <input
                      placeholder="Full Name *"
                      value={form.name}
                      onChange={e => { setForm({ ...form, name: e.target.value }); setFormErrors(fe => ({ ...fe, name: '' })); }}
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-colors ${formErrors.name ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-200 focus:ring-rose-400'}`}
                    />
                    {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email Address *"
                      value={form.email}
                      onChange={e => { setForm({ ...form, email: e.target.value }); setFormErrors(fe => ({ ...fe, email: '' })); }}
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-colors ${formErrors.email ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-200 focus:ring-rose-400'}`}
                    />
                    {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="Phone Number * (10 digits)"
                      value={form.phone}
                      maxLength={13}
                      onChange={e => { setForm({ ...form, phone: e.target.value.replace(/[^\d+]/g, '') }); setFormErrors(fe => ({ ...fe, phone: '' })); }}
                      className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-colors ${formErrors.phone ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-200 focus:ring-rose-400'}`}
                    />
                    {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
                  </div>
                  <input
                    placeholder="City / Location"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Skills / Areas of Interest</p>
                    <div className="flex flex-wrap gap-2">
                      {skills.map(s => (
                        <button type="button" key={s} onClick={() => toggleItem('skills', s)}
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${form.skills.includes(s) ? 'bg-rose-600 text-white border-rose-600' : 'border-rose-200 text-gray-600 hover:border-rose-400'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Availability</p>
                    <div className="flex flex-wrap gap-2">
                      {availability.map(a => (
                        <button type="button" key={a} onClick={() => toggleItem('availability', a)}
                          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${form.availability.includes(a) ? 'bg-rose-600 text-white border-rose-600' : 'border-rose-200 text-gray-600 hover:border-rose-400'}`}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea rows={3} placeholder="Tell us about yourself and why you want to volunteer..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none" />

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                      ⚠️ {error}
                    </div>
                  )}
                  <Button type="submit" size="lg" className="w-full bg-rose-600 hover:bg-rose-700 text-white" disabled={loading}>
                    {loading ? '⏳ Submitting...' : <><Heart className="w-5 h-5 fill-white" /> Submit Application</>}
                  </Button>
                </form>
              </div>

              {/* Benefits */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Volunteer With Us?</h2>
                <div className="space-y-4 mb-8">
                  {benefits.map(b => (
                    <div key={b.title} className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-rose-100 shadow-sm">
                      <span className="text-3xl">{b.icon}</span>
                      <div>
                        <p className="font-bold text-gray-900">{b.title}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{b.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-2xl p-6 text-white">
                  <p className="text-lg font-bold mb-2">500+ Active Volunteers</p>
                  <p className="text-rose-100 text-sm">Join our growing family of dedicated volunteers who have already impacted over 100 communities across India.</p>
                </div>
              </div>
            </div>
          )
        )}

        {/* ── CHECK STATUS TAB ── */}
        {activeTab === 'check' && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Application Status</h2>
                  <p className="text-sm text-gray-500">Enter your email to check your volunteer application</p>
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                <input type="email" placeholder="Enter your registered email..." value={checkEmail}
                  onChange={e => setCheckEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && checkStatus()}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  id="check-email" />
                <button onClick={() => checkStatus()} disabled={checkLoading}
                  className="px-4 py-3 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {checkLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {checkLoading ? 'Checking...' : 'Check'}
                </button>
              </div>

              {checkError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">⚠️ {checkError}</div>
              )}

              {appStatus?.found && (() => {
                const info = statusInfo[appStatus.status] ?? statusInfo.pending;
                const StatusIcon = info.icon;
                const isApproved = appStatus.status === 'active';

                return (
                  <div className="space-y-4">
                    {/* If approved, show the full celebration inline */}
                    {isApproved ? (
                      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-rose-50 border border-emerald-200 p-6 text-center">
                        <div className="text-4xl mb-3">🎉</div>
                        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 text-xs font-bold mb-3">
                          <CheckCircle className="w-3 h-3" /> APPROVED VOLUNTEER
                        </div>
                        <p className="text-xl font-extrabold text-gray-900 mb-1">
                          Congratulations, {appStatus.name}! 🙏
                        </p>
                        <p className="text-gray-600 text-sm mb-1">
                          You are now an official volunteer &amp; member of
                        </p>
                        <p className="text-rose-700 font-extrabold text-base mb-3">One World One Family 🌍</p>
                        <p className="text-gray-400 text-xs font-mono mb-4">ID: {appStatus.volunteer_id}</p>
                        {appStatus.notification && (
                          <p className="text-gray-600 text-sm bg-white rounded-xl p-3 border border-gray-100">
                            {appStatus.notification.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className={`rounded-2xl border ${info.border} ${info.bg} p-5`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`w-5 h-5 ${info.color}`} />
                              <span className={`text-sm font-bold ${info.color}`}>{info.label}</span>
                            </div>
                            <span className="text-xs text-gray-400 font-mono">{appStatus.volunteer_id}</span>
                          </div>
                          <p className="text-base font-semibold text-gray-900 mb-1">Hello, {appStatus.name}!</p>
                          <p className="text-xs text-gray-500">Applied on {prettyDate(appStatus.applied_at)}</p>
                        </div>

                        {appStatus.notification && (
                          <div className="rounded-2xl border bg-red-50 border-red-200 p-5">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-100">
                                <XCircle className="w-5 h-5 text-red-600" />
                              </div>
                              <div>
                                <p className="text-sm font-bold mb-1 text-red-700">❌ Application Not Approved</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{appStatus.notification.message}</p>
                                <p className="text-xs text-gray-400 mt-2">{prettyDate(appStatus.notification.date)}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {appStatus.status === 'pending' && !appStatus.notification && (
                          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                              </div>
                              <p className="text-sm font-bold text-amber-700">Awaiting Admin Review</p>
                            </div>
                            <p className="text-sm text-gray-600">
                              Your application is in the queue. Our team reviews applications regularly. This page auto-refreshes every 10 seconds.
                            </p>
                            <div className="mt-3 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                              <span className="text-xs text-amber-600 font-medium">Auto-refreshing...</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <button onClick={() => checkStatus()} disabled={checkLoading}
                      className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                      <RefreshCw className={`w-4 h-4 ${checkLoading ? 'animate-spin' : ''}`} />
                      Refresh Status
                    </button>
                  </div>
                );
              })()}

              {!appStatus && !checkError && (
                <div className="text-center py-8 text-gray-400">
                  <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Enter the email you used when applying to check your status.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
