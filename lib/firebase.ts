import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import {
  UserProfile,
  ProviderProfile,
  CustomerProfile,
  Booking,
  BookingStatus,
  ProviderMatch,
} from '@/types';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'mock_key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'mock_domain',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mock_project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'mock_bucket',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'mock_sender',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'mock_app_id',
};

// Initialize Firebase (singleton pattern for Next.js)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, 'servicehub110');
export const storage = getStorage(app);

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: 'customer' | 'provider',
  providerData?: Partial<ProviderProfile>
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  const base = {
    uid: cred.user.uid,
    email,
    name,
    role,
    createdAt: serverTimestamp(),
  };

  if (role === 'provider' && providerData) {
    const provDoc: Omit<ProviderProfile, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
      ...base,
      role: 'provider',
      skill: providerData.skill || '',
      city: providerData.city || '',
      availability: providerData.availability || [],
      experience: providerData.experience || 0,
      rating: 4.5,
      totalReviews: 0,
      completedJobs: 0,
      cancellationRate: 0,
      reliability: 95,
      isActive: true,
      bio: providerData.bio || '',
    };
    await setDoc(doc(db, 'users', cred.user.uid), provDoc);
    await setDoc(doc(db, 'providers', cred.user.uid), provDoc);
  } else {
    await setDoc(doc(db, 'users', cred.user.uid), base);
  }

  return cred.user;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// ─── USER PROFILE ─────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// ─── PROVIDERS ────────────────────────────────────────────────────────────────

export async function searchProviders(
  skill: string,
  city?: string
): Promise<ProviderProfile[]> {
  const colRef = collection(db, 'providers');
  // Search by skill (case-insensitive partial match via multiple queries)
  const skillLower = skill.toLowerCase();
  
  // Get all active providers and filter client-side for flexible matching
  const q = query(colRef, where('isActive', '==', true), limit(50));
  const snap = await getDocs(q);
  
  const providers: ProviderProfile[] = [];
  snap.forEach((d) => {
    const data = d.data() as ProviderProfile;
    const providerSkill = data.skill?.toLowerCase() || '';
    // Fuzzy match: check if skill contains any word from the search term
    const searchWords = skillLower.split(' ').filter(Boolean);
    const isMatch = searchWords.some(
      (w) => providerSkill.includes(w) || w.includes(providerSkill.split(' ')[0])
    );
    if (isMatch || skillLower.includes(providerSkill.split(' ')[0]?.toLowerCase() || '')) {
      if (!city || data.city?.toLowerCase() === city.toLowerCase()) {
        providers.push(data);
      }
    }
  });

  // If no matches found by skill, return all active providers in city
  if (providers.length === 0 && city) {
    snap.forEach((d) => {
      const data = d.data() as ProviderProfile;
      if (data.city?.toLowerCase() === city.toLowerCase()) {
        providers.push(data);
      }
    });
  }

  // Final fallback: return top providers
  if (providers.length === 0) {
    snap.forEach((d) => providers.push(d.data() as ProviderProfile));
  }

  return providers;
}

export function onProvidersRealtime(
  skill: string,
  callback: (providers: ProviderProfile[], error?: Error) => void
) {
  const q = query(
    collection(db, 'providers'),
    limit(20)
  );
  return onSnapshot(
    q,
    (snap) => {
      const providers: ProviderProfile[] = [];
      snap.forEach((d) => {
        const data = d.data() as ProviderProfile;
        const providerSkill = data.skill?.toLowerCase() || '';
        const searchLower = skill.toLowerCase();
        if (
          providerSkill.includes(searchLower) ||
          searchLower.includes(providerSkill.split(' ')[0] || '') ||
          true // include all for real-time
        ) {
          providers.push(data);
        }
      });
      callback(providers);
    },
    (error) => {
      console.error('Firebase providers listener error:', error);
      // Pass an empty array and the error so UI can display it
      callback([], error);
    }
  );
}

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

export async function createBooking(
  booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, 'bookings'), {
    ...booking,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  notes?: string
): Promise<void> {
  const ref = doc(db, 'bookings', bookingId);
  const update: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (notes) update.notes = notes;
  if (status === 'completed') update.completedAt = serverTimestamp();
  await updateDoc(ref, update);
}

export async function rejectAndReassign(
  bookingId: string,
  rejectedProviderId: string,
  nextMatch: ProviderMatch
): Promise<void> {
  const ref = doc(db, 'bookings', bookingId);
  await updateDoc(ref, {
    status: 'pending',
    providerId: nextMatch.provider.uid,
    providerName: nextMatch.provider.name,
    pricing: nextMatch.pricing,
    updatedAt: serverTimestamp(),
    rejectedProviders: arrayUnion(rejectedProviderId),
  });
}

export async function getBooking(bookingId: string): Promise<Booking | null> {
  const snap = await getDoc(doc(db, 'bookings', bookingId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Booking) : null;
}

export function onBookingRealtime(
  bookingId: string,
  callback: (booking: Booking | null) => void
) {
  return onSnapshot(doc(db, 'bookings', bookingId), (snap) => {
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() } as Booking) : null);
  });
}

export function onProviderBookings(
  providerId: string,
  callback: (bookings: Booking[]) => void
) {
  const q = query(
    collection(db, 'bookings'),
    where('providerId', '==', providerId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const bookings: Booking[] = [];
    snap.forEach((d) => bookings.push({ id: d.id, ...d.data() } as Booking));
    callback(bookings);
  });
}

export function onCustomerBookings(
  customerId: string,
  callback: (bookings: Booking[]) => void
) {
  const q = query(
    collection(db, 'bookings'),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc'),
    limit(10)
  );
  return onSnapshot(q, (snap) => {
    const bookings: Booking[] = [];
    snap.forEach((d) => bookings.push({ id: d.id, ...d.data() } as Booking));
    callback(bookings);
  });
}

export { Timestamp };
