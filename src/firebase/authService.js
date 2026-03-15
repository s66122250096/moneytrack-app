import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// สมัครสมาชิก
export async function registerUser(name, email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // อัปเดตชื่อใน Auth
  await updateProfile(user, { displayName: name });

  // สร้าง document ใน Firestore
  await setDoc(doc(db, 'users', user.uid), {
    name,
    email,
    createdAt: serverTimestamp(),
    monthlyBudget: 15000,
  });

  return user;
}

// เข้าสู่ระบบ
export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// ออกจากระบบ
export async function logoutUser() {
  await signOut(auth);
}
