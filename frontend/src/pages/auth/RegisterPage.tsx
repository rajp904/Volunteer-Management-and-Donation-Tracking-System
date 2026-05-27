import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { Heart, Eye, EyeOff, ArrowRight, Shield, Users, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { validateEmail, validatePhone, validatePassword, validatePasswordConfirm } from '@/lib/validation';

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

/** Password strength meter */
function PasswordStrength({ value }: { value: string }) {
  const len  = value.length;
  const has  = (r: RegExp) => r.test(value);
  const score =
    (len >= 8 ? 1 : 0) +
    (has(/[A-Z]/) ? 1 : 0) +
    (has(/[0-9]/) ? 1 : 0) +
    (has(/[^A-Za-z0-9]/) ? 1 : 0);

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-lime-400', 'bg-emerald-500'];

  if (!value) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400">{labels[score]}</p>
    </div>
  );
}

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email:                 '',
    phone:                 '',
    password:              '',
    password_confirmation: '',
    // These are sent to backend but not shown in UI
    name:                  '',
    role:                  'volunteer',
  });
  const [showPassword, setShowPassword]   = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors]               = useState<Record<string, string>>({});

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // Derive a display name from email if user didn't type one
  const derivedName = () => {
    if (form.email.includes('@')) return form.email.split('@')[0];
    return form.phone || 'User';
  };

  // ── Laravel registration ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Strict client-side validation ──────────────────────────────────────
    const clientErrors: Record<string, string> = {};

    const emailErr = validateEmail(form.email);
    if (emailErr) clientErrors.email = emailErr;

    if (form.phone.trim()) {
      const phoneErr = validatePhone(form.phone);
      if (phoneErr) clientErrors.phone = phoneErr;
    }

    const passErr = validatePassword(form.password);
    if (passErr) clientErrors.password = passErr;

    const confirmErr = validatePasswordConfirm(form.password, form.password_confirmation);
    if (confirmErr) clientErrors.password_confirmation = confirmErr;

    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }
    // ───────────────────────────────────────────────────────────────────────

    setLoading(true);
    setErrors({});
    try {
      const payload = {
        ...form,
        name: derivedName(),
      };
      const redirectTo = await register(payload);
      toast.success('Welcome to One World One Family! Your account has been created.');
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      const apiErrors = (err as { response?: { data?: { errors?: Record<string, string[]> } } })?.response?.data?.errors;
      if (apiErrors) {
        const flat: Record<string, string> = {};
        Object.entries(apiErrors).forEach(([k, v]) => { flat[k] = v[0]; });
        setErrors(flat);
      } else {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(msg || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Google Sign-Up ────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const redirectTo = await loginWithGoogle();
      toast.success('Account created with Google! Welcome aboard.');
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Google sign-up failed. Please try again.';
      if (!msg.includes('popup-closed')) toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const passwordsMatch =
    form.password_confirmation.length === 0 ||
    form.password === form.password_confirmation;

  return (
    <div className="min-h-screen flex">
      {/* ── Left side — Branding (same as Login) ────────────────────────── */}
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

      {/* ── Right side — Register form ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-rose-50/60 via-white to-slate-50 p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-4">

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
            <h2 className="text-3xl font-extrabold text-gray-900 mb-1.5 tracking-tight">Create your account</h2>
            <p className="text-gray-500 text-sm">Join thousands of NGOs making a real difference</p>
          </div>

          {/* ── Form ────────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="register-email">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                id="register-email"
                type="email"
                name="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-400 bg-white
                  focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent
                  transition-all duration-150 shadow-sm
                  ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="register-phone">
                Phone Number
              </label>
              <input
                id="register-phone"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={set('phone')}
                placeholder="+91 98765 43210"
                autoComplete="tel"
                className={`w-full px-4 py-3 rounded-xl border text-sm text-gray-900 placeholder-gray-400 bg-white
                  focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent
                  transition-all duration-150 shadow-sm
                  ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="register-password">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="Min. 8 characters"
                  required
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm text-gray-900 placeholder-gray-400 bg-white
                    focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent
                    transition-all duration-150 shadow-sm
                    ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength value={form.password} />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="register-confirm">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="register-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={set('password_confirmation')}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                  className={`w-full px-4 py-3 pr-11 rounded-xl border text-sm text-gray-900 placeholder-gray-400 bg-white
                    focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-150 shadow-sm
                    ${!passwordsMatch || errors.password_confirmation
                      ? 'border-red-400 bg-red-50 focus:ring-red-400'
                      : 'border-gray-200 focus:ring-rose-500'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {(!passwordsMatch || errors.password_confirmation) && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.password_confirmation || 'Passwords do not match.'}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                         bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800
                         text-white text-sm font-semibold shadow-md shadow-rose-200
                         active:scale-[0.98] transition-all duration-150 mt-2
                         disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium whitespace-nowrap">or continue with</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google — BELOW the form */}
          <button
            id="btn-google-register"
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

          {/* Sign-in link */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-rose-600 font-semibold hover:text-rose-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
