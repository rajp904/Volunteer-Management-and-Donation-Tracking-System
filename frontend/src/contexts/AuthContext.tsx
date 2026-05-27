import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  ConfirmationResult,
  ApplicationVerifier,
  updateProfile,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { syncUserToFirestore } from '@/lib/firestore';
import api from '@/lib/api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  // ── Original email/password (Laravel) ──
  login: (email: string, password: string) => Promise<string>;
  register: (data: RegisterData) => Promise<string>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  // ── Firebase methods ──
  loginWithGoogle: () => Promise<string>;
  loginWithEmail: (email: string, password: string, role?: string) => Promise<string>;
  registerWithEmail: (email: string, password: string, name: string, role?: string) => Promise<string>;
  sendPhoneOtp: (phone: string, appVerifier: ApplicationVerifier) => Promise<ConfirmationResult>;
  confirmPhoneOtp: (confirmationResult: ConfirmationResult, code: string, role?: string) => Promise<string>;
  // ── Role helpers ──
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: () => boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  role?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [isLoading, setIsLoading] = useState(true);
  const didInit = useRef(false);

  // ── Validate stored token once on mount ──────────────────────────────────
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    if (token) {
      if (user) {
        setIsLoading(false);
      } else {
        fetchUser();
      }
    } else {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const fetchedUser = response.data;
      setUser(fetchedUser);
      localStorage.setItem('auth_user', JSON.stringify(fetchedUser));
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Helper: exchange a Firebase idToken for a Sanctum token ─────────────
  const exchangeFirebaseToken = async (
    idToken: string,
    role = 'volunteer'
  ): Promise<string> => {
    const response = await api.post('/auth/firebase', { idToken, role });
    const { token: newToken, user: newUser, redirect_to } = response.data;
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return redirect_to ?? '/';
  };

  // ── Helper: build a minimal User from Firebase claims (no backend needed) ─
  const buildUserFromFirebase = (firebaseUser: FirebaseUser, role = 'volunteer'): User => {
    return {
      id: 0,
      name: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'User',
      email: firebaseUser.email ?? '',
      avatar: firebaseUser.photoURL ?? undefined,
      is_active: true,
      roles: [{ id: 1, name: role }],
      created_at: new Date().toISOString(),
    };
  };

  // ── Check if an error is a network / backend-down error ──────────────────
  const isBackendDown = (err: unknown): boolean => {
    const code   = (err as { code?: string })?.code ?? '';
    const msg    = (err as { message?: string })?.message?.toLowerCase() ?? '';
    const status = (err as { response?: { status?: number } })?.response?.status;
    return (
      code === 'ERR_NETWORK' ||
      code === 'ECONNREFUSED' ||
      code === 'ERR_CONNECTION_REFUSED' ||
      msg.includes('network') ||
      msg.includes('connection refused') ||
      msg.includes('failed to fetch') ||
      (status !== undefined && status >= 500)
    );
  };

  // ── Original Laravel login (unchanged) ───────────────────────────────────
  const login = async (email: string, password: string): Promise<string> => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser, redirect_to } = response.data;
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);

    // ── Always send admins straight to dashboard ───────────────────────────
    const ADMIN_ROLES = ['super-admin', 'org-admin', 'coordinator', 'accountant', 'auditor'];
    const userIsAdmin = newUser?.roles?.some((r: { name: string }) => ADMIN_ROLES.includes(r.name));
    if (userIsAdmin) return '/dashboard';

    return redirect_to ?? '/';
  };

  // ── Original Laravel register (unchanged) ────────────────────────────────
  const register = async (data: RegisterData): Promise<string> => {
    const response = await api.post('/auth/register', data);
    const { token: newToken, user: newUser, redirect_to } = response.data;
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return redirect_to ?? '/';
  };

  // ── Firebase: Google Sign-In ─────────────────────────────────────────────
  const loginWithGoogle = async (): Promise<string> => {
    // Step 1: Firebase popup — opens Google account selector
    const result = await signInWithPopup(auth, googleProvider);

    // Step 2: Get the ID token — token from signInWithPopup is always fresh,
    // DO NOT use forceRefresh:true as it adds a needless network round-trip
    const idToken = await result.user.getIdToken();

    // Step 3: Exchange for a Laravel Sanctum token (user stored in MongoDB)
    try {
      const redirect = await exchangeFirebaseToken(idToken, 'volunteer');

      // Sync to Firestore after successful login (fire-and-forget, non-blocking)
      syncUserToFirestore(result.user, 'volunteer').catch(() => {});

      return redirect;
    } catch (backendErr: unknown) {
      const msg  = (backendErr as { message?: string })?.message?.toLowerCase() ?? '';
      const code = (backendErr as { code?: string })?.code ?? '';

      // Only fall back to Firebase-only mode if the Laravel server is offline
      const isOffline =
        code === 'ERR_NETWORK' ||
        code === 'ERR_CONNECTION_REFUSED' ||
        msg.includes('network error') ||
        msg.includes('failed to fetch') ||
        msg.includes('econnrefused');

      if (isOffline) {
        console.warn('[AuthContext] Laravel offline — Firebase-only fallback.');
        const fbUser = buildUserFromFirebase(result.user, 'volunteer');
        localStorage.setItem('auth_token', idToken);
        localStorage.setItem('auth_user', JSON.stringify(fbUser));
        setToken(idToken);
        setUser(fbUser);
        return '/';
      }

      throw backendErr;
    }
  };


  // ── Firebase: Email + Password Sign-In ──────────────────────────────────
  const loginWithEmail = async (
    email: string,
    password: string,
    role = 'volunteer'
  ): Promise<string> => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await result.user.getIdToken();
    await syncUserToFirestore(result.user, role);
    return exchangeFirebaseToken(idToken, role);
  };

  // ── Firebase: Email + Password Registration ──────────────────────────────
  const registerWithEmail = async (
    email: string,
    password: string,
    name: string,
    role = 'volunteer'
  ): Promise<string> => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    // Set display name in Firebase
    await updateProfile(result.user, { displayName: name });
    const idToken = await result.user.getIdToken();
    await syncUserToFirestore(result.user, role);
    return exchangeFirebaseToken(idToken, role);
  };

  // ── Firebase: Phone — Step 1: Send OTP ───────────────────────────────────
  const sendPhoneOtp = async (
    phone: string,
    appVerifier: ApplicationVerifier
  ): Promise<ConfirmationResult> => {
    return signInWithPhoneNumber(auth, phone, appVerifier);
  };

  // ── Firebase: Phone — Step 2: Confirm OTP ────────────────────────────────
  const confirmPhoneOtp = async (
    confirmationResult: ConfirmationResult,
    code: string,
    role = 'volunteer'
  ): Promise<string> => {
    const result = await confirmationResult.confirm(code);
    const idToken = await result.user.getIdToken();
    await syncUserToFirestore(result.user, role);
    return exchangeFirebaseToken(idToken, role);
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore */ }
    try {
      await signOut(auth);
    } catch { /* ignore */ }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
  };

  const hasRole = (role: string) =>
    user?.roles?.some((r) => r.name === role) ?? false;

  const hasAnyRole = (roles: string[]) =>
    user?.roles?.some((r) => roles.includes(r.name)) ?? false;

  const ADMIN_ROLES = ['super-admin', 'org-admin', 'coordinator', 'accountant', 'auditor'];
  const isAdmin = () =>
    user?.roles?.some((r) => ADMIN_ROLES.includes(r.name)) ?? false;

  return (
    <AuthContext.Provider
      value={{
        user, token, isLoading,
        login, register, logout, updateUser,
        loginWithGoogle, loginWithEmail, registerWithEmail,
        sendPhoneOtp, confirmPhoneOtp,
        hasRole, hasAnyRole, isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
