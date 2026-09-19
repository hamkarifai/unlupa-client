import { db } from './firebase';
import { collection, doc, setDoc, getDoc, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { UserProfile } from '../types';

export const syncToFirestore = async (userId: string, key: string, data: any) => {
  if (!userId) return;
  try {
    const docRef = doc(db, 'users', userId, 'app_data', key);
    await setDoc(docRef, { data, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error(`Error syncing ${key} to Firestore:`, error);
  }
};

export const listenToFirestore = (userId: string, key: string, callback: (data: any) => void) => {
  if (!userId) return () => {};
  const docRef = doc(db, 'users', userId, 'app_data', key);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data().data);
    }
  });
};
