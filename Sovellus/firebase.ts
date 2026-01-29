import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDDLNnb4YSuDmlGhNX4X0KSVYzolXjXBgI",
  authDomain: "mobis-id.firebaseapp.com",
  projectId: "mobis-id",
  storageBucket: "mobis-id.firebasestorage.app",
  messagingSenderId: "376736498097",
  appId: "1:376736498097:web:b55f7060451928c4383d90",
  measurementId: "G-VMKFEQ3HVE"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
