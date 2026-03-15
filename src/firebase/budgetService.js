import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./config";

export async function getBudget(userId) {
  const snap = await getDoc(doc(db, "users", userId));
  if (snap.exists()) return snap.data().monthlyBudget || 15000;
  return 15000;
}

export async function updateBudget(userId, amount) {
  await updateDoc(doc(db, "users", userId), { monthlyBudget: amount });
}

// ดึงสถานะการแจ้งเตือน
export async function getNotificationSetting(userId) {
  const snap = await getDoc(doc(db, "users", userId));
  if (snap.exists()) {
    const data = snap.data();
    return data.notifyBudget !== undefined ? data.notifyBudget : true;
  }
  return true;
}

// บันทึกสถานะการแจ้งเตือน
export async function setNotificationSetting(userId, enabled) {
  await updateDoc(doc(db, "users", userId), { notifyBudget: enabled });
}

export function checkBudgetAlert(currentExpense, budget) {
  if (budget <= 0) return null;
  const pct = (currentExpense / budget) * 100;
  if (pct >= 100) {
    return { type: "danger", message: `⚠️ คุณใช้จ่ายเกินงบประมาณแล้ว!\nใช้ไป ฿${currentExpense.toLocaleString()} จากงบ ฿${budget.toLocaleString()}` };
  }
  if (pct >= 80) {
    return { type: "warning", message: `🔔 ใกล้ถึงงบประมาณแล้ว!\nใช้ไป ${pct.toFixed(1)}% (฿${currentExpense.toLocaleString()} / ฿${budget.toLocaleString()})` };
  }
  return null;
}
