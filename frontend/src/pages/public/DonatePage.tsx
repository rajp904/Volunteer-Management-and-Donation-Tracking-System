import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Heart, ArrowRight, FolderOpen, CheckCircle, Loader2, ShieldCheck, BadgeCheck, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { validateName, validateEmail, validatePhone, validateAmount } from '@/lib/validation';
import api from '@/lib/api';

const amounts = [100, 500, 1000, 5000, 10000];

const impacts = [
  { icon: '🍛', amount: '₹100',    impact: 'Feeds a family for a day' },
  { icon: '📚', amount: '₹500',    impact: 'School supplies for 2 children' },
  { icon: '🏥', amount: '₹1,000',  impact: 'Free medical check-up camp' },
  { icon: '♿', amount: '₹5,000',  impact: 'Supports a person with disability' },
  { icon: '🌱', amount: '₹10,000', impact: "Sponsors a child's education" },
];

const inputCls = (err: string) =>
  `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-colors ${
    err ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-200 focus:ring-rose-400'
  }`;

export default function DonatePage() {
  const { user, isAdmin, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const programName = searchParams.get('program') || '';
  const programId   = searchParams.get('program_id') ? parseInt(searchParams.get('program_id')!) : null;

  const [selected, setSelected] = useState<number | null>(1000);
  const [custom, setCustom]     = useState('');
  const [form, setForm]         = useState({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [receipt, setReceipt]   = useState<{
    receipt_number: string;
    transaction_id: string;
    amount: number;
    program: string;
  } | null>(null);

  const finalAmount = custom ? parseInt(custom) : selected;

  const setField = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    errs.amount = validateAmount(finalAmount ?? null);
    errs.name   = validateName(form.name);
    errs.email  = validateEmail(form.email);
    errs.phone  = validatePhone(form.phone);
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.values(errs).some(Boolean)) { setErrors(errs); return; }

    setLoading(true);
    setErrors({});

    try {
      const res = await api.post('/public/donations/donate', {
        amount:     finalAmount,
        name:       form.name,
        email:      form.email,
        phone:      form.phone     || undefined,
        program:    programName    || undefined,
        program_id: programId      || undefined,
        message:    form.message   || undefined,
      });

      setReceipt({
        receipt_number: res.data.receipt_number,
        transaction_id: res.data.transaction_id,
        amount:         res.data.amount,
        program:        res.data.program,
      });
      setSubmitted(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Something went wrong. Please try again.';
      setErrors({ amount: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50">
      {/* ── Navbar ── */}
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
            ].map(item => (
              <Link
                key={item.label}
                to={item.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  item.to === '/donate'
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

      <div className="h-16" />

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-rose-600 to-rose-800 text-white py-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-semibold mb-4 backdrop-blur-sm">
            <Heart className="w-4 h-4 fill-white" /> Make a Difference Today
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Every Rupee Counts</h1>
          <p className="text-rose-100 text-lg max-w-xl mx-auto">
            Your generous donation helps us provide food, education, healthcare, and hope to thousands of families across India.
          </p>
        </div>
      </section>

      {/* ── Kindness note ── */}
      <div className="max-w-3xl mx-auto px-6 pt-10">
        <div className="flex items-start gap-4 bg-rose-50 border border-rose-200 rounded-2xl px-6 py-5">
          <span className="text-2xl mt-0.5">🙏</span>
          <p className="text-rose-700 font-medium text-base leading-relaxed">
            We believe kindness should come from the heart. Contribute only if you genuinely love and support our work.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {submitted && receipt ? (
          /* ── SUCCESS SCREEN ── */
          <div className="text-center py-12 max-w-xl mx-auto">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 mb-6 shadow-lg">
              <CheckCircle className="w-14 h-14 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Thank You, {form.name}! 🎉</h2>
            <p className="text-gray-500 text-base mb-8">Your donation was successful and has been recorded.</p>

            {/* Receipt card */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-6 text-left space-y-4 mb-8">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                <span className="text-2xl">🧾</span>
                <span className="font-bold text-gray-800 text-lg">Donation Receipt</span>
              </div>
              <div className="grid grid-cols-2 gap-y-4 text-sm">
                <span className="text-gray-500 font-medium">Amount Paid</span>
                <span className="font-bold text-rose-700 text-base">₹{receipt.amount.toLocaleString()}</span>

                {receipt.program && receipt.program !== 'General Donation' && (
                  <>
                    <span className="text-gray-500 font-medium">Program</span>
                    <span className="font-semibold text-gray-800">{receipt.program}</span>
                  </>
                )}

                <span className="text-gray-500 font-medium">Donor Name</span>
                <span className="font-semibold text-gray-800">{form.name}</span>

                <span className="text-gray-500 font-medium">Email</span>
                <span className="font-semibold text-gray-800 break-all">{form.email}</span>

                <span className="text-gray-500 font-medium">Receipt No.</span>
                <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                  {receipt.receipt_number}
                </span>

                <span className="text-gray-500 font-medium">Transaction ID</span>
                <span className="font-mono text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded break-all">
                  {receipt.transaction_id}
                </span>

                <span className="text-gray-500 font-medium">Status</span>
                <span className="inline-flex items-center gap-1 text-green-700 font-bold">
                  <CheckCircle className="w-4 h-4" /> Completed
                </span>

                <span className="text-gray-500 font-medium">Date</span>
                <span className="font-semibold text-gray-800">
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Trust row */}
            <div className="flex items-center justify-center gap-6 mb-8 text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-green-500" /> Secure</span>
              <span className="flex items-center gap-1"><BadgeCheck className="w-4 h-4 text-blue-500" /> Verified</span>
              <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500" /> 80G Eligible</span>
            </div>

            <blockquote className="italic text-rose-600 font-semibold text-lg mb-8">
              "No act of kindness, no matter how small, is ever wasted."
            </blockquote>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-8 py-3 bg-rose-600 text-white rounded-2xl font-bold hover:bg-rose-700 transition-colors shadow-md"
            >
              Back to Home <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          /* ── DONATION FORM ── */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Form card */}
            <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Donation</h2>

              {/* Program banner */}
              {programName && (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3 mb-5">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-xs text-rose-500 font-semibold uppercase tracking-wide">Donating to Program</p>
                    <p className="text-sm font-bold text-rose-800">{programName}</p>
                  </div>
                  <span className="ml-auto text-xl">🎯</span>
                </div>
              )}

              {/* Quick amounts */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {amounts.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => { setSelected(amt); setCustom(''); setErrors(e => ({ ...e, amount: '' })); }}
                    className={`py-2.5 rounded-xl font-semibold text-sm border-2 transition-all ${
                      selected === amt && !custom
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : 'border-rose-200 text-gray-700 hover:border-rose-400 hover:bg-rose-50'
                    }`}
                  >
                    ₹{amt.toLocaleString()}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className={`py-2.5 rounded-xl font-semibold text-sm border-2 transition-all ${
                    !selected ? 'bg-rose-600 text-white border-rose-600' : 'border-rose-200 text-gray-700 hover:border-rose-400 hover:bg-rose-50'
                  }`}
                >
                  Custom
                </button>
              </div>

              {/* Custom amount */}
              {(!selected || custom) && (
                <div className="mb-4">
                  <input
                    type="number"
                    placeholder="Enter amount (₹)"
                    value={custom}
                    min={10}
                    onChange={e => { setCustom(e.target.value); setErrors(er => ({ ...er, amount: '' })); }}
                    className={inputCls(errors.amount)}
                  />
                  {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                </div>
              )}
              {errors.amount && !(!selected || custom) && (
                <p className="text-xs text-red-500 mb-3">{errors.amount}</p>
              )}

              {/* Amount preview */}
              {finalAmount && (
                <div className="bg-rose-50 rounded-xl px-4 py-3 mb-6 text-rose-700 font-semibold text-sm">
                  💛 You are donating{' '}
                  <span className="text-rose-600 text-base font-bold">₹{finalAmount.toLocaleString()}</span>
                  {programName && <span className="text-rose-500"> to {programName}</span>}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Name */}
                <div>
                  <input
                    placeholder="Full Name *"
                    value={form.name}
                    onChange={e => setField('name', e.target.value)}
                    className={inputCls(errors.name)}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <input
                    type="email"
                    placeholder="Email Address *"
                    value={form.email}
                    onChange={e => setField('email', e.target.value)}
                    className={inputCls(errors.email)}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>

                {/* Phone */}
                <div>
                  <input
                    type="tel"
                    placeholder="Phone Number (10 digits)"
                    value={form.phone}
                    maxLength={13}
                    onChange={e => setField('phone', e.target.value.replace(/[^\d+]/g, ''))}
                    className={inputCls(errors.phone)}
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>

                {/* Message */}
                <textarea
                  rows={3}
                  placeholder="Message (optional)"
                  value={form.message}
                  onChange={e => setField('message', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
                />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-2xl font-bold text-white text-base bg-rose-600 hover:bg-rose-700 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 shadow-lg flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                  ) : (
                    <><Heart className="w-5 h-5 fill-white" /> Donate ₹{finalAmount?.toLocaleString() ?? '—'} Now</>
                  )}
                </button>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-5 pt-1">
                  <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> SSL Secured
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                    <BadgeCheck className="w-3.5 h-3.5 text-blue-500" /> Verified NGO
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-400 font-medium">
                    🏛️ 80G Eligible
                  </span>
                </div>
              </form>
            </div>

            {/* Impact sidebar */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Impact</h2>
              <div className="space-y-4">
                {impacts.map(i => (
                  <div key={i.amount} className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-rose-100 shadow-sm hover:shadow-md transition-shadow">
                    <span className="text-3xl">{i.icon}</span>
                    <div>
                      <p className="font-bold text-rose-700">{i.amount}</p>
                      <p className="text-sm text-gray-600">{i.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 bg-gradient-to-br from-rose-600 to-rose-700 rounded-2xl p-6 text-white">
                <p className="font-bold text-lg mb-1">100% Transparent</p>
                <p className="text-rose-100 text-sm">
                  Every donation is tracked and reported. We are committed to full transparency in how funds are utilized.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
