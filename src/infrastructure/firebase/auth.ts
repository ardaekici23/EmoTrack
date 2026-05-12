import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './client';
import { User, SignUpData, SignInData } from '../../domain/user/types';
import { FIREBASE_COLLECTIONS } from '../../shared/constants';

export async function signUp(data: SignUpData): Promise<User> {
  const { user: fbUser } = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const user: User = {
    userId: fbUser.uid,
    name: data.name,
    email: data.email,
    role: data.role,
    teamId: data.teamId,
    createdAt: new Date(),
  };
  await setDoc(doc(db, FIREBASE_COLLECTIONS.USERS, fbUser.uid), {
    ...user,
    createdAt: Timestamp.fromDate(user.createdAt),
  });
  return user;
}

export async function signIn(data: SignInData): Promise<User> {
  const { user: fbUser } = await signInWithEmailAndPassword(auth, data.email, data.password);
  const snap = await getDoc(doc(db, FIREBASE_COLLECTIONS.USERS, fbUser.uid));
  if (!snap.exists()) throw new Error('User data not found in database');

  const d = snap.data();
  return {
    userId: d.userId,
    name: d.name,
    email: d.email,
    role: d.role,
    teamId: d.teamId,
    createdAt: d.createdAt.toDate(),
  };
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function getCurrentUser(): Promise<User | null> {
  if (!auth.currentUser) return null;

  const snap = await getDoc(doc(db, FIREBASE_COLLECTIONS.USERS, auth.currentUser.uid));
  if (!snap.exists()) return null;

  const d = snap.data();
  return {
    userId: d.userId,
    name: d.name,
    email: d.email,
    role: d.role,
    teamId: d.teamId,
    createdAt: d.createdAt.toDate(),
  };
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}
