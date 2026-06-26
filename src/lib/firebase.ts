import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, query, 
  where, orderBy, serverTimestamp, updateDoc, increment, deleteDoc, Timestamp
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
          const name = user.displayName || user.email || "Tarotista (Yo)";
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
  evolution?: string;
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

export const exportUserData = async (userId: string) => {
  try {
    const people = await getPeople(userId);
    const readings = await getUserHistory(userId);
    return {
      version: "1.5",
      backupDate: new Date().toISOString(),
      creator: "Benjamín Hardoy",
      forTarotist: auth.currentUser?.displayName || auth.currentUser?.email || "Tarotista",
      people,
      readings
    };
  } catch (error) {
    console.error("Error exporting user data:", error);
    throw error;
  }
};

export const importUserData = async (userId: string, backupData: any): Promise<{ importedPeople: number, importedReadings: number }> => {
  if (!backupData || !Array.isArray(backupData.people) || !Array.isArray(backupData.readings)) {
    throw new Error("El archivo de copia de seguridad no tiene un formato válido.");
  }

  const currentPeople = await getPeople(userId);
  const selfPerson = currentPeople.find(p => p.isSelf === true);
  
  const personIdMap = new Map<string, string>();
  let importedPeopleCount = 0;

  // Process people
  for (const importedP of backupData.people) {
    if (!importedP || !importedP.name) continue;

    if (importedP.isSelf) {
      if (selfPerson) {
        // Update existing self person if needed
        await updatePerson(userId, selfPerson.id, {
          birthDate: importedP.birthDate || selfPerson.birthDate || '',
          birthTime: importedP.birthTime || selfPerson.birthTime || '',
          birthPlace: importedP.birthPlace || selfPerson.birthPlace || '',
          notes: importedP.notes || selfPerson.notes || 'Ficha personal para mis consultas y lecturas generales.'
        });
        personIdMap.set(importedP.id, selfPerson.id);
      } else {
        // Create new self person (should normally exist, but fallback)
        const docId = await savePerson(
          userId, 
          importedP.name, 
          importedP.birthDate, 
          importedP.birthTime, 
          importedP.birthPlace, 
          importedP.notes
        );
        const personRef = doc(db, 'people', docId);
        await updateDoc(personRef, { isSelf: true });
        personIdMap.set(importedP.id, docId);
        importedPeopleCount++;
      }
    } else {
      // Non-self person
      const existingP = currentPeople.find(p => p.name.trim().toLowerCase() === importedP.name.trim().toLowerCase() && !p.isSelf);
      if (existingP) {
        personIdMap.set(importedP.id, existingP.id);
      } else {
        const docId = await savePerson(
          userId,
          importedP.name,
          importedP.birthDate,
          importedP.birthTime,
          importedP.birthPlace,
          importedP.notes
        );
        personIdMap.set(importedP.id, docId);
        importedPeopleCount++;
      }
    }
  }

  // Get updated people list to map any remaining unmatched names
  const updatedPeople = await getPeople(userId);

  // Process readings
  const currentHistory = await getUserHistory(userId);
  let importedReadingsCount = 0;

  for (const reading of backupData.readings) {
    if (!reading || !Array.isArray(reading.cards) || reading.cards.length === 0) continue;

    // Detect if reading already exists (to prevent duplication)
    const isDuplicate = currentHistory.some(existing => {
      const sameCards = existing.cards?.length === reading.cards?.length &&
                        existing.cards?.every((c: string, idx: number) => c === reading.cards[idx]);
      
      const extSecs = existing.timestamp?.seconds;
      let rdSecs = 0;
      if (reading.timestamp) {
        if (typeof reading.timestamp.seconds === 'number') {
          rdSecs = reading.timestamp.seconds;
        } else {
          rdSecs = Math.floor(new Date(reading.timestamp).getTime() / 1000);
        }
      }

      const sameTime = extSecs && rdSecs ? Math.abs(extSecs - rdSecs) < 10 : true; // tolerance of 10s
      return sameCards && sameTime && (existing.question === reading.question);
    });

    if (isDuplicate) {
      continue;
    }

    // Determine mapped personId
    let mappedPersonId: string | null = null;
    let mappedPersonName: string | null = reading.personName || null;

    if (reading.personId) {
      mappedPersonId = personIdMap.get(reading.personId) || null;
    }

    // Fallback: search by name in updated people if no direct ID mapping is found
    if (!mappedPersonId && reading.personName) {
      const foundP = updatedPeople.find(p => p.name.trim().toLowerCase() === reading.personName.trim().toLowerCase());
      if (foundP) {
        mappedPersonId = foundP.id;
        mappedPersonName = foundP.name;
      }
    }

    // Reconstruct timestamp
    let readingTimestamp: any = serverTimestamp();
    if (reading.timestamp) {
      if (typeof reading.timestamp.seconds === 'number') {
        readingTimestamp = new Timestamp(reading.timestamp.seconds, reading.timestamp.nanoseconds || 0);
      } else {
        const ms = new Date(reading.timestamp).getTime();
        if (!isNaN(ms)) {
          readingTimestamp = Timestamp.fromMillis(ms);
        }
      }
    }

    // Save reading document directly to database
    const readingsRef = collection(db, 'readings');
    await addDoc(readingsRef, {
      userId,
      cards: reading.cards,
      deckId: reading.deckId || 'waite',
      timestamp: readingTimestamp,
      personId: mappedPersonId,
      personName: mappedPersonName,
      question: reading.question || null
    });

    importedReadingsCount++;
  }

  // Recalculate stats completely across ALL readings for this user
  const allReadings = await getUserHistory(userId);
  const totalReadings = allReadings.length;
  const statsMap: Record<string, number> = {};

  allReadings.forEach(r => {
    if (Array.isArray(r.cards)) {
      r.cards.forEach((cardId: string) => {
        statsMap[cardId] = (statsMap[cardId] || 0) + 1;
      });
    }
  });

  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    totalReadings,
    stats: statsMap,
    email: auth.currentUser?.email || null,
    displayName: auth.currentUser?.displayName || null,
    lastBackupRestore: serverTimestamp()
  }, { merge: true });

  return {
    importedPeople: importedPeopleCount,
    importedReadings: importedReadingsCount
  };
};
