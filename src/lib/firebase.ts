import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, query, 
  where, orderBy, serverTimestamp, updateDoc, increment, deleteDoc 
} from 'firebase/firestore';
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

      // Ensure default self-person exists in people collection
      try {
        const peopleRef = collection(db, 'people');
        const q = query(
          peopleRef,
          where('userId', '==', user.uid),
          where('isSelf', '==', true)
        );
        const qSnap = await getDocs(q);
        if (qSnap.empty) {
          const name = user.displayName || "Jesica Hardoy (Yo)";
          await addDoc(peopleRef, {
            userId: user.uid,
            name,
            isSelf: true,
            birthDate: '',
            birthTime: '',
            birthPlace: '',
            notes: 'Ficha personal para mis consultas y lecturas generales.',
            createdAt: serverTimestamp()
          });
        }
      } catch (err) {
        console.error("Error ensuring self-person exists:", err);
      }

      callback(user);
    } else {
      callback(null);
    }
  });
};

// Error handling helper for Firestore operations
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ---------------- PEOPLE OPERATIONS ----------------

export interface Person {
  id: string;
  userId: string;
  name: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  notes?: string;
  createdAt?: any;
  isSelf?: boolean;
}

export const getPeople = async (userId: string): Promise<Person[]> => {
  const path = 'people';
  try {
    const q = query(
      collection(db, path),
      where('userId', '==', userId),
      orderBy('name', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    } as Person));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const savePerson = async (
  userId: string, 
  name: string, 
  birthDate?: string, 
  birthTime?: string, 
  birthPlace?: string, 
  notes?: string
): Promise<string> => {
  const path = 'people';
  try {
    const docRef = await addDoc(collection(db, path), {
      userId,
      name,
      birthDate: birthDate || '',
      birthTime: birthTime || '',
      birthPlace: birthPlace || '',
      notes: notes || '',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const updatePerson = async (
  userId: string,
  personId: string,
  data: Partial<Omit<Person, 'id' | 'userId' | 'createdAt'>>
): Promise<void> => {
  const path = `people/${personId}`;
  try {
    const personRef = doc(db, 'people', personId);
    await updateDoc(personRef, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deletePerson = async (userId: string, personId: string): Promise<void> => {
  const path = `people/${personId}`;
  try {
    const personRef = doc(db, 'people', personId);
    await deleteDoc(personRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// ---------------- READINGS WITH PERSON SUPPORT ----------------

export const saveReading = async (
  userId: string, 
  cardIds: string[], 
  deckId: string, 
  personId?: string, 
  personName?: string,
  question?: string
) => {
  const path = 'readings';
  try {
    const readingRef = collection(db, path);
    await addDoc(readingRef, {
      userId,
      cards: cardIds,
      deckId,
      timestamp: serverTimestamp(),
      personId: personId || null,
      personName: personName || null,
      question: question || null
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  const userPath = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    
    // Update stats
    const updates: Record<string, any> = {
      totalReadings: increment(1)
    };
    cardIds.forEach(cardId => {
      updates[`stats.${cardId}`] = increment(1);
    });
    
    await updateDoc(userRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
};

export const getUserHistory = async (userId: string, personId?: string) => {
  const path = 'readings';
  try {
    let q;
    if (personId) {
      q = query(
        collection(db, path),
        where('userId', '==', userId),
        where('personId', '==', personId),
        orderBy('timestamp', 'desc')
      );
    } else {
      q = query(
        collection(db, path),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as any)
    }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const getUserStats = async (userId: string) => {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};
