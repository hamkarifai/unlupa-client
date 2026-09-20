import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId
};

// Initialize Firebase securely
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use custom provisioned database ID
const customDatabaseId = firebaseConfigData.firestoreDatabaseId || '(default)';
export const db = getFirestore(app, customDatabaseId);

// Google Auth Provider setup with select_account prompt
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Perform secure Google Sign-In (optimized for Mobile & Web)
 */
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    // If popup is blocked by iframe or browser policy, fallback to redirect
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user') {
      try {
        await signInWithRedirect(auth, googleProvider);
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult?.user) {
          return redirectResult.user;
        }
      } catch (redirectErr) {
        console.warn('Redirect sign-in fallback notice:', redirectErr);
      }
    }
    throw error;
  }
}

/**
 * Check if the browser is returning from a redirect sign in
 */
export async function handleRedirectResult(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (error) {
    console.error('Error handling redirect result:', error);
    return null;
  }
}

/**
 * Sign in or Register quickly with Email & Password
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  const sanitizedEmail = email.trim().toLowerCase();
  try {
    // Try sign in first
    const userCredential = await signInWithEmailAndPassword(auth, sanitizedEmail, password);
    return userCredential.user;
  } catch (error: any) {
    // If user not found, automatically register securely
    if (error?.code === 'auth/user-not-found' || error?.code === 'auth/invalid-credential') {
      try {
        const newUserCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password);
        return newUserCredential.user;
      } catch (createErr) {
        throw createErr;
      }
    }
    throw error;
  }
}

/**
 * Passwordless Magic Link Authentication for ultra-simple Mobile Login
 */
export async function sendEmailLoginLink(email: string): Promise<void> {
  const sanitizedEmail = email.trim().toLowerCase();
  const actionCodeSettings = {
    url: window.location.href,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, sanitizedEmail, actionCodeSettings);
  window.localStorage.setItem('unlupa_email_for_signin', sanitizedEmail);
}

/**
 * Complete Passwordless Sign-In if incoming link is detected
 */
export async function completeEmailLinkSignIn(): Promise<User | null> {
  if (isSignInWithEmailLink(auth, window.location.href)) {
    let email = window.localStorage.getItem('unlupa_email_for_signin');
    if (!email) {
      email = window.prompt('Mohon masukkan email Anda untuk konfirmasi login:');
    }
    if (email) {
      const result = await signInWithEmailLink(auth, email, window.location.href);
      window.localStorage.removeItem('unlupa_email_for_signin');
      return result.user;
    }
  }
  return null;
}

/**
 * Secure Logout
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Sync user profile to Firestore securely
 */
export async function syncUserProfileToFirestore(user: User): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    
    if (!snap.exists()) {
      await setDoc(userRef, {
        id: user.uid,
        email: user.email || '',
        fullName: user.displayName || user.email?.split('@')[0] || 'Penghafal Qur\'an',
        avatarUrl: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
        role: 'student',
        plan: 'free',
        emailVerified: user.emailVerified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      await updateDoc(userRef, {
        lastLoginAt: new Date().toISOString(),
        emailVerified: user.emailVerified,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.warn('Firestore profile sync info (offline-safe):', error);
  }
}
