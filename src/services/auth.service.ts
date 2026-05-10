/**
 * Authentication service
 * Handles user authentication operations with Firebase Auth
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  onAuthStateChanged,
  UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, SignUpData, SignInData } from '../types/User';
import { FIREBASE_COLLECTIONS } from '../utils/constants';

/**
 * Sign up a new user
 */
export async function signUp(data: SignUpData): Promise<User> {
  try {
    // Create auth user
    const userCredential: UserCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    // Create user document in Firestore
    const user: User = {
      userId: userCredential.user.uid,
      name: data.name,
      email: data.email,
      role: data.role,
      teamId: data.teamId,
      createdAt: new Date(),
    };

    await setDoc(doc(db, FIREBASE_COLLECTIONS.USERS, userCredential.user.uid), {
      ...user,
      createdAt: Timestamp.fromDate(user.createdAt),
    });

    console.log('✓ User created successfully:', user.email);
    return user;
  } catch (error: any) {
    console.error('Sign up error:', error);
    throw new Error(error.message || 'Failed to sign up');
  }
}

/**
 * Sign in an existing user
 */
export async function signIn(data: SignInData): Promise<User> {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    // Fetch user data from Firestore
    const userDoc = await getDoc(
      doc(db, FIREBASE_COLLECTIONS.USERS, userCredential.user.uid)
    );

    if (!userDoc.exists()) {
      throw new Error('User data not found in database');
    }

    const userData = userDoc.data();
    const user: User = {
      userId: userData.userId,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      teamId: userData.teamId,
      createdAt: userData.createdAt.toDate(),
    };

    console.log('✓ User signed in successfully:', user.email);
    return user;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
    console.log('✓ User signed out successfully');
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
}

/**
 * Get the current user's data from Firestore
 */
export async function getCurrentUser(): Promise<User | null> {
  const firebaseUser = auth.currentUser;

  if (!firebaseUser) {
    return null;
  }

  try {
    const userDoc = await getDoc(
      doc(db, FIREBASE_COLLECTIONS.USERS, firebaseUser.uid)
    );

    if (!userDoc.exists()) {
      console.error('User document not found');
      return null;
    }

    const userData = userDoc.data();
    return {
      userId: userData.userId,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      teamId: userData.teamId,
      createdAt: userData.createdAt.toDate(),
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Listen to authentication state changes
 */
export function onAuthChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return auth.currentUser !== null;
}
