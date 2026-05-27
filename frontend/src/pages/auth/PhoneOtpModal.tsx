import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createRecaptchaVerifier } from '@/lib/firebase';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';
import { X, Phone, ArrowRight, ChevronLeft, ShieldCheck } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: (redirectTo: string) => void;
}

type Step = 'phone' | 'otp';

export default function PhoneOtpModal({ onClose, onSuccess }: Props) {
  const { sendPhoneOtp, confirmPhoneOtp } = useAuth();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('+91 ');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      try { recaptchaRef.current?.clear(); } catch { /* ignore */ }
    };
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  // ── Send OTP ─────────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleaned = phone.replace(/\s+/g, '').trim();
    if (!/^\+[1-9]\d{6,14}$/.test(cleaned)) {
      setError('Please enter a valid phone number with country code (e.g. +91 98765 43210)');
      return;
    }

    setLoading(true);
    try {
      // Create invisible reCAPTCHA on the hidden div
      if (!recaptchaRef.current) {
        recaptchaRef.current = createRecaptchaVerifier('recaptcha-container');
      }
      confirmationRef.current = await sendPhoneOtp(cleaned, recaptchaRef.current);
      setStep('otp');
      setCountdown(60);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to send OTP. Please try again.';
      setError(msg.includes('auth/') ? formatFirebaseError(msg) : msg);
      // Reset reCAPTCHA on error
      try { recaptchaRef.current?.clear(); recaptchaRef.current = null; } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  };

  // ── Confirm OTP ──────────────────────────────────────────────────────────
  const handleConfirmOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    if (!confirmationRef.current) {
      setError('Session expired. Please request a new OTP.');
      setStep('phone');
      return;
    }

    setLoading(true);
    try {
      const redirectTo = await confirmPhoneOtp(confirmationRef.current, code, 'volunteer');
      onSuccess(redirectTo);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Invalid OTP. Please try again.';
      setError(msg.includes('auth/') ? formatFirebaseError(msg) : msg);
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input box handling ───────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpInputsRef.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpInputsRef.current[5]?.focus();
    }
    e.preventDefault();
  };

  // ── Firebase error formatter ─────────────────────────────────────────────
  const formatFirebaseError = (msg: string): string => {
    if (msg.includes('invalid-phone-number')) return 'Invalid phone number format.';
    if (msg.includes('too-many-requests')) return 'Too many attempts. Please wait and try again.';
    if (msg.includes('invalid-verification-code')) return 'Incorrect OTP. Please check and retry.';
    if (msg.includes('code-expired')) return 'OTP has expired. Please request a new one.';
    if (msg.includes('quota-exceeded')) return 'SMS quota exceeded. Please try later.';
    return 'Something went wrong. Please try again.';
  };

  return (
    <>
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" className="hidden" />

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Phone sign-in"
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal card */}
        <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step === 'otp' && (
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setError(''); setOtp(['','','','','','']); }}
                  className="text-white/80 hover:text-white transition-colors mr-1"
                  aria-label="Go back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                {step === 'phone' ? (
                  <Phone className="w-4 h-4 text-white" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-white" />
                )}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  {step === 'phone' ? 'Phone Sign-In' : 'Verify OTP'}
                </p>
                <p className="text-rose-200 text-xs">
                  {step === 'phone' ? 'We\'ll send you a code' : `Sent to ${phone.trim()}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {error && (
              <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <p className="text-sm text-rose-600">{error}</p>
              </div>
            )}

            {/* Step 1 — Phone number */}
            {step === 'phone' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="phone-input" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    id="phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all"
                    autoComplete="tel"
                    autoFocus
                    required
                  />
                  <p className="mt-1.5 text-xs text-gray-400">
                    Include country code (e.g. +91 for India)
                  </p>
                </div>

                <button
                  id="btn-send-otp"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-medium text-sm py-3 rounded-xl transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Send OTP <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}

            {/* Step 2 — OTP entry */}
            {step === 'otp' && (
              <form onSubmit={handleConfirmOtp} className="space-y-5">
                <div>
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    Enter the 6-digit code sent to your phone
                  </p>
                  <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpInputsRef.current[i] = el; }}
                        id={`otp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-11 h-12 text-center text-lg font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400 transition-all"
                      />
                    ))}
                  </div>
                </div>

                <button
                  id="btn-verify-otp"
                  type="submit"
                  disabled={loading || otp.join('').length < 6}
                  className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-medium text-sm py-3 rounded-xl transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Verify & Sign In <ShieldCheck className="w-4 h-4" /></>
                  )}
                </button>

                {/* Resend */}
                <p className="text-center text-xs text-gray-500">
                  Didn't receive it?{' '}
                  {countdown > 0 ? (
                    <span className="text-gray-400">Resend in {countdown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setStep('phone'); setError(''); setOtp(['','','','','','']); }}
                      className="text-rose-600 font-medium hover:text-rose-700"
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
