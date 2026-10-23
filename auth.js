// auth.js - Firebase Auth (Email/Password only) shared by every page.
// Uses the SAME Firebase SDK version as order-save.js and shares one app,
// so Firestore automatically sends the signed-in user's token with each order.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Refresh the user and, once verified, refresh the token too so
// Firestore rules see email_verified = true right away.
export async function checkVerified() {
  const user = auth.currentUser;
  if (!user) return false;
  await user.reload();
  if (user.emailVerified) await user.getIdToken(true);
  return user.emailVerified;
}

export async function signUp(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user);
  return cred.user;
}

export async function logIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await checkVerified();
  return cred.user;
}

export function resendVerification() {
  if (!auth.currentUser) throw new Error("Please log in first.");
  return sendEmailVerification(auth.currentUser);
}

export function resetPassword(email) { return sendPasswordResetEmail(auth, email); }
export function logOut() { return signOut(auth); }

// callback receives { user, canShop }
export function watchAuth(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback({ user, canShop: !!(user && user.emailVerified) });
  });
}

export function authMessage(err) {
  const map = {
    "auth/email-already-in-use": "That email already has an account. Try logging in.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/missing-password": "Please enter your password.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/user-not-found": "Wrong email or password.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/too-many-requests": "Too many attempts. Please wait a bit and try again.",
    "auth/network-request-failed": "No connection. Please check your internet and try again."
  };
  return map[err && err.code] || "Something went wrong. Please try again.";
}