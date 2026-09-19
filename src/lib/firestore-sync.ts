import { db } from './firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';

// Debounce map to prevent spamming Firestore
const syncTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

export const syncToFirestore = (userId: string, key: string, data: any) => {
  if (!userId || userId === 'guest') return;
  
  const syncKey = `${userId}_${key}`;
  if (syncTimeouts[syncKey]) {
    clearTimeout(syncTimeouts[syncKey]);
  }

  syncTimeouts[syncKey] = setTimeout(async () => {
    try {
      const docRef = doc(db, 'user_data', userId, 'app_state', key);
      // Strip undefined values which Firestore rejects
      const sanitizedData = JSON.parse(JSON.stringify(data));
      await setDoc(docRef, { data: sanitizedData, updatedAt: new Date().toISOString() });
      console.log(`Synced ${key} to Firestore`);
    } catch (error) {
      console.error(`Error syncing ${key} to Firestore:`, error);
    }
  }, 2000); // 2 second debounce
};

export const fetchFromFirestore = async (userId: string, key: string): Promise<any | null> => {
  if (!userId || userId === 'guest') return null;
  try {
    const docRef = doc(db, 'user_data', userId, 'app_state', key);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data().data;
    }
  } catch (error) {
    console.error(`Error fetching ${key} from Firestore:`, error);
  }
  return null;
};

// Public Library Sync
export async function publishToPublicLibrary(userId: string, entry: any): Promise<void> {
  if (!db) return;
  try {
    const bookDoc = {
      ...entry,
      userId,
      isPublic: true,
      publishedAt: new Date().toISOString()
    };
    const docRef = doc(db, 'books', entry.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(bookDoc)));
  } catch (error) {
    console.error('Failed to publish book to public library in Firestore:', error);
    throw error;
  }
}

export async function fetchPublicLibrary(): Promise<any[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, 'books'), where('isPublic', '==', true));
    const querySnapshot = await getDocs(q);
    const library: any[] = [];
    querySnapshot.forEach((docSnap) => {
      library.push(docSnap.data());
    });
    return library;
  } catch (error) {
    console.error('Failed to fetch public library from Firestore:', error);
    return [];
  }
}

// Global Class Management
export async function syncClassToGlobal(classData: any): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'classes', classData.id);
    await setDoc(docRef, JSON.parse(JSON.stringify(classData)));
  } catch (error) {
    console.error('Failed to sync class to global collection:', error);
  }
}

export async function findClassByCodeGlobal(code: string): Promise<any | null> {
  if (!db) return null;
  try {
    const q = query(collection(db, 'classes'), where('code', '==', code.toUpperCase()));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
  } catch (error) {
    console.error('Failed to find class by code:', error);
  }
  return null;
}


const enrollTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

export async function enrollStudentInGlobalClass(classId: string, studentId: string, studentData: any): Promise<void> {
  if (!db) return;
  const syncKey = `${classId}_${studentId}`;
  if (enrollTimeouts[syncKey]) {
    clearTimeout(enrollTimeouts[syncKey]);
  }
  
  enrollTimeouts[syncKey] = setTimeout(async () => {
    try {
      const sanitizedData = JSON.parse(JSON.stringify(studentData));
      const docRef = doc(db, 'classes', classId, 'students', studentId);
      await setDoc(docRef, sanitizedData, { merge: true });
    } catch (error) {
      console.error('Failed to enroll student globally:', error);
    }
  }, 1500);
}

export async function fetchClassStudentsGlobal(classId: string): Promise<any[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, 'classes', classId, 'students'));
    const querySnapshot = await getDocs(q);
    const students: any[] = [];
    querySnapshot.forEach((docSnap) => {
      students.push(docSnap.data());
    });
    return students;
  } catch (error) {
    console.error('Failed to fetch class students:', error);
    return [];
  }
}

export async function getTeacherTeachingClasses(teacherId: string): Promise<any[]> {
  if (!db) return [];
  try {
    const docRef = doc(db, 'user_data', teacherId, 'app_state', 'teaching_classes');
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data().data || [];
  } catch (error) {
    console.error('Failed to fetch teacher teaching classes:', error);
  }
  return [];
}

export async function updateTeacherTeachingClasses(teacherId: string, classesData: any[]): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'user_data', teacherId, 'app_state', 'teaching_classes');
    const sanitizedData = JSON.parse(JSON.stringify(classesData));
    await setDoc(docRef, { data: sanitizedData, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Failed to update teacher teaching classes:', error);
  }
}

export async function removeStudentFromGlobalClass(classId: string, studentId: string): Promise<void> {
  if (!db) return;
  try {
    const docRef = doc(db, 'classes', classId, 'students', studentId);
    // Delete the student doc from the class
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Failed to remove student globally:', error);
  }
}

export const listenToFirestore = (userId: string, key: string, callback: (data: any) => void): (() => void) | null => {
  if (!userId || userId === 'guest') return null;
  try {
    const docRef = doc(db, 'user_data', userId, 'app_state', key);
    const unsubscribe = onSnapshot(docRef, (snap: any) => {
      if (snap.exists()) {
        callback(snap.data().data);
      }
    });
    return unsubscribe;
  } catch (error) {
    console.error(`Error listening to ${key} from Firestore:`, error);
  }
  return null;
};

export const listenToClassStudentsGlobal = (classId: string, callback: (students: any[]) => void): (() => void) | null => {
  if (!db || !classId) return null;
  try {
    
    const q = query(collection(db, 'classes', classId, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const students: any[] = [];
      snapshot.forEach((docSnap: any) => {
        students.push(docSnap.data());
      });
      callback(students);
    });
    return unsubscribe;
  } catch (error) {
    console.error('Failed to listen to class students:', error);
    return null;
  }
};
