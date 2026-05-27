import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyCsV6mAgQ97VKZpu810slE_MOn3bgBEzko',
  authDomain: 'one-world---one-family.firebaseapp.com',
  projectId: 'one-world---one-family',
  storageBucket: 'one-world---one-family.firebasestorage.app',
  messagingSenderId: '852439078951',
  appId: '1:852439078951:web:bd299033cc295c20475602',
  measurementId: 'G-5DFHWNHYFZ',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Firestore
export const db = getFirestore(app);

// Analytics (only in browser)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Recaptcha helper — call this once per session for phone auth
export function createRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
  });
}

export default app;
