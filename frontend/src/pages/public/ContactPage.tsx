import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin, Clock, Send, CheckCircle, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { validateName, validateEmail, validatePhone, validateMessage } from '@/lib/validation';
import api from '@/lib/api';

const contactInfo = [
  { icon: Mail, label: 'Email', value: 'admin@oneworldonefamily.org', href: 'mailto:admin@oneworldonefamily.org' },
  { icon: Phone, label: 'Phone', value: '+91 98765 43210', href: 'tel:+919876543210' },
  { icon: MapPin, label: 'HQ Address', value: 'Hyderabad, Telangana, India', href: '#' },
  { icon: MapPin, label: 'Branch — Vizag', value: 'Vizag, Andhra Pradesh, India', href: '#' },
  { icon: MapPin, label: 'Branch — Bangalore', value: 'Bangalore, Karnataka, India', href: '#' },
  { icon: MapPin, label: 'Branch — Chennai', value: 'Chennai, Tamil Nadu, India', href: '#' },
  { icon: Clock, label: 'Office Hours', value: 'Mon–Sat: 9:00 AM – 6:00 PM', href: '#' },
];

const faqs = [
  { q: 'How can I donate?', a: 'Click "Donate Now" in the navigation or visit our Donate page. We accept online transfers and cash donations.' },
  { q: 'Can I volunteer part-time?', a: 'Absolutely! We have flexible volunteering options — weekends, weekday evenings, or full-time. Every hour counts.' },
  { q: 'How are donations used?', a: 'Every donation is allocated directly to programs — food, education, medical camps, and disaster relief. We publish annual reports for full transparency.' },
  { q: 'Do I receive a donation receipt?', a: 'Yes, you will receive an official receipt via email for all donations, which is valid for tax exemption purposes.' },
];

const inputCls = (err: string) =>
  `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition-colors ${
    err ? 'border-red-400 bg-red-50 focus:ring-red-400' : 'border-gray-200'
  }`;

export default function ContactPage() {
  const { user, isAdmin, logout } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const setField = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    errs.name    = validateName(form.name);
    errs.email   = validateEmail(form.email);
    errs.phone   = validatePhone(form.phone);
    if (!form.subject) errs.subject = 'Please select a subject.';
    errs.message = validateMessage(form.message, true);
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    const hasErrors = Object.values(errs).some(Boolean);
    setErrors(errs);
    if (hasErrors) return;

    setLoading(true);
    setServerError('');
    try {
      await api.post('/public/contact', {
        name:    form.name,
        email:   form.email,
        phone:   form.phone   || undefined,
        subject: form.subject,
        message: form.message,
      });
      setSubmitted(true);
    } catch (err: any) {
      setServerError(err?.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
                  item.to === '/contact'
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
            <Heart className="w-4 h-4 fill-white" /> Get In Touch
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Contact Us</h1>
          <p className="text-rose-100 text-lg max-w-xl mx-auto">
            We'd love to hear from you. Whether you have a question, want to partner, or just want to say hello — reach out!
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">

          {/* Contact info cards */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reach Us Directly</h2>
            {contactInfo.map(({ icon: Icon, label, value, href }) => (
              <a key={label} href={href}
                className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-rose-100 shadow-sm hover:border-rose-300 hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                  <Icon className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{label}</p>
                  <p className="text-sm font-semibold text-gray-800">{value}</p>
                </div>
              </a>
            ))}

            {/* Map embed placeholder */}
            <div className="rounded-2xl overflow-hidden border border-rose-100 shadow-sm mt-4 bg-rose-50 px-4 py-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-500">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-semibold">Our Offices</span>
              </div>
              {[
                'Hyderabad, Telangana (HQ)',
                'Vizag, Andhra Pradesh',
                'Bangalore, Karnataka',
                'Chennai, Tamil Nadu',
              ].map(loc => (
                <div key={loc} className="flex items-center gap-2 text-rose-400 text-xs pl-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                  {loc}
                </div>
              ))}
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="bg-white rounded-3xl border border-rose-100 shadow-sm p-10 text-center h-full flex flex-col items-center justify-center">
                <CheckCircle className="w-16 h-16 text-rose-500 mb-4" />
                <h2 className="text-2xl font-bold text-rose-700 mb-2">Message Sent! 🙏</h2>
                <p className="text-gray-600 mb-2">Thank you <strong>{form.name}</strong>! We'll get back to you at <strong>{form.email}</strong> within 24–48 hours.</p>
                <blockquote className="italic text-rose-500 font-semibold text-base mt-4">
                  "Love All, Serve All."
                </blockquote>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <input
                        placeholder="Full Name *"
                        value={form.name}
                        onChange={e => setField('name', e.target.value)}
                        className={inputCls(errors.name)}
                      />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
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
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div>
                      <select
                        value={form.subject}
                        onChange={e => setField('subject', e.target.value)}
                        className={`${inputCls(errors.subject)} bg-white text-gray-600`}
                      >
                        <option value="">Select Subject *</option>
                        <option>General Inquiry</option>
                        <option>Donation Query</option>
                        <option>Volunteer Registration</option>
                        <option>Partnership / Collaboration</option>
                        <option>Media / Press</option>
                        <option>Other</option>
                      </select>
                      {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
                    </div>
                  </div>
                  <div>
                    <textarea
                      rows={5}
                      placeholder="Your message... *"
                      value={form.message}
                      onChange={e => setField('message', e.target.value)}
                      className={`${inputCls(errors.message)} resize-none`}
                    />
                    {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
                  </div>
                  {serverError && (
                    <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{serverError}</p>
                  )}
                  <Button type="submit" size="lg" className="w-full bg-rose-600 hover:bg-rose-700 text-white" disabled={loading}>
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Message</>}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl p-6 border border-rose-100 shadow-sm">
                <p className="font-bold text-gray-900 mb-2">❓ {q}</p>
                <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
