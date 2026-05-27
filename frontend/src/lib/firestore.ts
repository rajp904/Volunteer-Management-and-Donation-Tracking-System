import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db } from './firebase';

export interface FirestoreUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  role: string;
  provider: string;
  createdAt: ReturnType<typeof serverTimestamp> | null;
  lastLoginAt: ReturnType<typeof serverTimestamp>;
}

/**
 * Syncs the Firebase user profile to Firestore (users/{uid}).
 * Uses merge: true so existing fields are never overwritten on login.
 */
export async function syncUserToFirestore(
  firebaseUser: FirebaseUser,
  role = 'volunteer'
): Promise<void> {
  try {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const provider =
      firebaseUser.providerData[0]?.providerId ?? 'email';

    const profile: Partial<FirestoreUserProfile> = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      phoneNumber: firebaseUser.phoneNumber,
      role,
      provider,
      lastLoginAt: serverTimestamp(),
    };

    // Only set createdAt on first write (merge will skip it if already there)
    await setDoc(
      userRef,
      {
        ...profile,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    // Never block auth flow because of Firestore failures
    console.warn('[Firestore] syncUserToFirestore failed:', err);
  }
}
