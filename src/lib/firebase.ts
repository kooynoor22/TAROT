import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, query, where, orderBy, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import config from '../../firebase-applet-config.json';

const app = initializeApp(config);
export const db = getFirestore(app);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign-Out Error:", error);
  }
};

// Listen to auth state
export const initAuth = (callback: (user: User | null) => void) => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Ensure user document exists
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          totalReadings: 0,
          stats: {},
          email: user.email || null,
          displayName: user.displayName || null,
        });
      }
      callback(user);
    } else {
      callback(null);
    }
  });
};

export const saveReading = async (userId: string, cardIds: string[], deckId: string) => {
  const readingRef = collection(db, 'readings');
  await addDoc(readingRef, {
    userId,
    cards: cardIds,
    deckId,
    timestamp: serverTimestamp()
  });

  const userRef = doc(db, 'users', userId);
  
  // Update stats
  const updates: Record<string, any> = {
    totalReadings: increment(1)
  };
  cardIds.forEach(cardId => {
    updates[`stats.${cardId}`] = increment(1);
  });
  
  await updateDoc(userRef, updates);
};

export const getUserHistory = async (userId: string) => {
  const q = query(
    collection(db, 'readings'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getUserStats = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
};
