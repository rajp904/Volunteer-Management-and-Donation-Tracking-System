// ─────────────────────────────────────────────────────────────────
//  Shared validation helpers — used across all forms in the app
// ─────────────────────────────────────────────────────────────────

/** Valid email: must contain @ and end with a real domain like .com / .in / .org etc. */
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

/** Indian phone: exactly 10 digits, starting with 6-9 (optionally with +91 / 0 prefix) */
export const PHONE_REGEX = /^(?:\+91|0)?[6-9]\d{9}$/;

/** Strong password: min 8 chars, at least one uppercase, one digit, one special char */
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/** Full name: at least 2 characters, only letters + spaces */
export const NAME_REGEX = /^[a-zA-Z\s]{2,}$/;

/** PAN number: Indian format AAAAA0000A */
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

// ─────────────────────────────────────────────────────────────────
//  Validation functions — return error string or '' if valid
// ─────────────────────────────────────────────────────────────────

export function validateName(value: string): string {
  if (!value.trim()) return 'Full name is required.';
  if (!NAME_REGEX.test(value.trim())) return 'Name must contain only letters and spaces (min 2 characters).';
  return '';
}

export function validateEmail(value: string): string {
  if (!value.trim()) return 'Email address is required.';
  if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address (e.g. name@gmail.com).';
  return '';
}

export function validatePhone(value: string, required = false): string {
  if (!value.trim()) return required ? 'Phone number is required.' : '';
  const cleaned = value.replace(/\s+/g, '');
  if (!PHONE_REGEX.test(cleaned)) return 'Enter a valid 10-digit Indian mobile number (e.g. 9876543210).';
  return '';
}

export function validatePassword(value: string): string {
  if (!value) return 'Password is required.';
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter.';
  if (!/\d/.test(value)) return 'Password must contain at least one number.';
  if (!/[^A-Za-z0-9]/.test(value)) return 'Password must contain at least one special character (e.g. @, #, !).';
  return '';
}

export function validatePasswordConfirm(password: string, confirm: string): string {
  if (!confirm) return 'Please confirm your password.';
  if (password !== confirm) return 'Passwords do not match.';
  return '';
}

export function validateMessage(value: string, required = false): string {
  if (required && !value.trim()) return 'Message is required.';
  if (value.trim() && value.trim().length < 10) return 'Message is too short (min 10 characters).';
  return '';
}

export function validateAmount(value: number | null): string {
  if (!value || value <= 0) return 'Please select or enter a donation amount.';
  if (value < 10) return 'Minimum donation amount is ₹10.';
  if (value > 10_000_000) return 'Maximum donation amount is ₹1 Crore.';
  return '';
}

export function validatePAN(value: string, required = false): string {
  if (!value.trim()) return required ? 'PAN number is required.' : '';
  if (!PAN_REGEX.test(value.trim().toUpperCase())) return 'Enter a valid PAN number (e.g. ABCDE1234F).';
  return '';
}

/** Returns true if a value has changed and has an error */
export function hasError(errors: Record<string, string>, field: string): boolean {
  return !!errors[field];
}
