import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * FIREBASE MIDDLEWARE ENGINE
 * ──────────────────────────────────────────────────────────────────────────
 * This file serves as the main entry point to our backend data store. It configures
 * the underlying client services (Firestore & Authentication) and runs validation
 * health checks on boot to catch connection errors early.
 */

// Initialize the monolithic Firebase Web SDK Client
const app = initializeApp(firebaseConfig);

/**
 * Multi-Database Configuration: We must read the custom 'firestoreDatabaseId' 
 * defined inside our platform configuration to keep separate sandbox structures aligned.
 */
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); 
export const auth = getAuth(app);

// Google Sign-In Provider initialization
const provider = new GoogleAuthProvider();

/**
 * Authenticates user securely via Firebase's native popup mechanisms
 */
export const loginWithGoogle = () => signInWithPopup(auth, provider);

/**
 * Clear the session state completely and signs out the user
 */
export const logoutUser = () => signOut(auth);

/**
 * Boot-Time Firebase Connection Verification
 * Performs a silent, un-cached network ping to the security collections on Firestore.
 * If the client is offline or the configuration is invalid, this raises diagnostic logs.
 */
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The Firestore container appears unreachable.");
    }
  }
}
testConnection();
