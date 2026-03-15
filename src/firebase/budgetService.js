import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./config";

// ดึงงบประมาณ
export async function getBudget(userId) {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data().monthlyBudget || 15000;
  }
  return 15000;
}

// อัปเดตงบประมาณ
export async function updateBudget(userId, amount) {
  const ref = doc(db, "users", userId);
  await updateDoc(ref, { monthlyBudget: amount });
}
