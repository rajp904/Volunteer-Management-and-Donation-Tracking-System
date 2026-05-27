import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { Heart, Eye, EyeOff, ArrowRight, Shield, Users, DollarSign, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { EMAIL_REGEX, PHONE_REGEX } from '@/lib/validation';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/** Detect whether the user typed an email or a phone number */
function isEmail(value: string) {
  return value.includes('@');
}

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe]     = useState(false);
  const [loading, setLoading]           = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]               = useState('');

  // ── Determine icon to show next to identifier field ─────────────────────
  const isPhoneMode = identifier.trim() && !isEmail(identifier);
  const IdentifierIcon = isPhoneMode ? Phone : Mail;

  // ── Email / Phone + Password Login ────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Strict client-side identifier validation ───────────────────────────
    const id = identifier.trim();
    if (!id) { setError('Please enter your email or phone number.'); return; }

    const looksLikeEmail = id.includes('@');
    if (looksLikeEmail && !EMAIL_REGEX.test(id)) {
      setError('Enter a valid email address (e.g. name@gmail.com).');
      return;
    }
    if (!looksLikeEmail) {
      const cleaned = id.replace(/\s+/g, '');
      if (!PHONE_REGEX.test(cleaned)) {
        setError('Enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
        return;
      }
    }
    if (!password) { setError('Please enter your password.'); return; }
    // ────────────────────────────────────────────────────────────────────

    setLoading(true);
    setError('');
    try {
      // Pass identifier as `email` field — backend now handles both
      const redirectTo = await login(identifier.trim(), password);
      toast.success('Welcome back! You are now signed in.');
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed. Please check your credentials and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign-In ───────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    const safetyTimer = setTimeout(() => setGoogleLoading(false), 30_000);
    try {
      const redirectTo = await loginWithGoogle();
      toast.success('Signed in with Google!');
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      console.error('[Google Sign-In Error]', err);
      const firebaseCode = (err as { code?: string })?.code ?? '';
      if (
        firebaseCode === 'auth/popup-closed-by-user' ||
        firebaseCode === 'auth/cancelled-popup-request'
      ) return;

      const errCode = (err as { code?: string })?.code ?? '';
      const errMsg  = (err as { message?: string })?.message?.toLowerCase() ?? '';
      const isNetworkError =
        errCode === 'ERR_NETWORK' || errCode === 'ECONNREFUSED' ||
        errMsg.includes('network') || errMsg.includes('failed to fetch');

      const backendMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const display =
        backendMsg ||
        (isNetworkError ? '⚠️ Cannot reach the server. Make sure the Laravel backend is running.' : null) ||
        (err as { message?: string })?.message ||
        'Google sign-in failed. Please try again.';

      setError(display);
      toast.error(display);
    } finally {
      clearTimeout(safetyTimer);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left side — Branding ──────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full bg-white/10" />
          <div className="absolute top-1/4 -left-16 w-48 h-48 rounded-full bg-rose-500/30" />
          <div className="absolute bottom-1/3 right-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-rose-800/40" />
        </div>

        {/* Logo + headline */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-14">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-none block">One World One Family</span>
              <span className="text-rose-200 text-xs">NGO Management Platform</span>
            </div>
          </div>

          <h1 className="text-[2.6rem] font-extrabold text-white mb-5 leading-[1.15] tracking-tight">
            Managing Impact,<br />
            <span className="text-rose-200">One Volunteer</span><br />
            at a Time.
          </h1>
          <p className="text-rose-100 text-base leading-relaxed max-w-xs">
            The all-in-one platform for NGOs to manage volunteers, track donations, and measure community impact.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-3">
          {[
            { icon: Users,       value: '5,000+', label: 'Volunteers' },
            { icon: DollarSign,  value: '₹2Cr+',  label: 'Tracked'    },
            { icon: Shield,      value: '100%',   label: 'Secure'     },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center ring-1 ring-white/10">
              <Icon className="w-4 h-4 text-rose-200 mx-auto mb-2" />
              <p className="text-white font-bold text-base">{value}</p>
              <p className="text-rose-200 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right side — Login form ──────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-rose-50/60 via-white to-slate-50 p-6 lg:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <span className="text-gray-900 font-bold text-lg block leading-none">One World One Family</span>
              <span className="text-gray-400 text-xs">NGO Management Platform</span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-1.5 tracking-tight">Welcome back</h2>
            <p className="text-gray-500 text-sm">Sign in to your account to continue</p>
          </div>



          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* ── Form ────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Identifier: email OR phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="login-identifier">
                Email or Phone Number
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <IdentifierIcon className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="login-identifier"
                  type="text"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="Enter email or phone number"
                  required
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent
                             transition-all duration-150 shadow-sm"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">You can sign in with your email or phone number</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400
                             focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent
                             transition-all duration-150 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-rose-600 hover:text-rose-700 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Sign-in button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                         bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800
                         text-white text-sm font-semibold shadow-md shadow-rose-200
                         active:scale-[0.98] transition-all duration-150
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google button — BELOW the form */}
          <button
            id="btn-google-login"
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white
                       hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98]
                       transition-all duration-150 text-sm font-medium text-gray-700 shadow-sm
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-gray-300 border-t-rose-600 rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          {/* Sign-up link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-rose-600 font-semibold hover:text-rose-700 transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
