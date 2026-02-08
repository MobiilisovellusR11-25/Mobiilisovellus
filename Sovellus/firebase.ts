import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDDLNnb4YSuDmlGhNX4X0KSVYzolXjXBgI",
  authDomain: "mobis-id.firebaseapp.com",
  projectId: "mobis-id",
  storageBucket: "mobis-id.firebasestorage.app",
  messagingSenderId: "376736498097",
  appId: "1:376736498097:web:b55f7060451928c4383d90",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);


