import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from './config';

const DEFAULT_INCOME = ['เงินเดือน', 'โบนัส', 'ธุรกิจส่วนตัว', 'ของขวัญ', 'อื่นๆ'];
const DEFAULT_EXPENSE = ['อาหาร', 'ขนส่ง', 'ช้อปปิ้ง', 'ค่าเช่า', 'ค่าน้ำค่าไฟ', 'สุขภาพ', 'บันเทิง', 'อื่นๆ'];

export async function getCategories(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  if (snap.exists()) {
    const data = snap.data();
    return {
      income: data.categoriesIncome || DEFAULT_INCOME,
      expense: data.categoriesExpense || DEFAULT_EXPENSE,
    };
  }
  return { income: DEFAULT_INCOME, expense: DEFAULT_EXPENSE };
}

export async function addCategory(userId, type, name) {
  const field = type === 'income' ? 'categoriesIncome' : 'categoriesExpense';
  const defaults = type === 'income' ? DEFAULT_INCOME : DEFAULT_EXPENSE;

  // ดึงข้อมูลก่อนเพื่อเช็คว่า field มีอยู่แล้วหรือยัง
  const snap = await getDoc(doc(db, 'users', userId));
  const existing = snap.exists() ? snap.data()[field] : null;

  if (existing && Array.isArray(existing)) {
    // field มีอยู่แล้ว — ใช้ arrayUnion ได้เลย ไม่ทำให้ข้อมูลเดิมหาย
    await updateDoc(doc(db, 'users', userId), { [field]: arrayUnion(name) });
  } else {
    // field ยังไม่มีใน Firestore — สร้างจาก default + รายการใหม่
    const merged = [...defaults, name].filter((v, i, a) => a.indexOf(v) === i);
    await updateDoc(doc(db, 'users', userId), { [field]: merged });
  }
}

export async function removeCategory(userId, type, name) {
  const field = type === 'income' ? 'categoriesIncome' : 'categoriesExpense';
  const defaults = type === 'income' ? DEFAULT_INCOME : DEFAULT_EXPENSE;

  // เช็คว่า field มีอยู่หรือยัง
  const snap = await getDoc(doc(db, 'users', userId));
  const existing = snap.exists() ? snap.data()[field] : null;

  if (existing && Array.isArray(existing)) {
    await updateDoc(doc(db, 'users', userId), { [field]: arrayRemove(name) });
  } else {
    // ลบออกจาก default แล้วบันทึก
    const filtered = defaults.filter((c) => c !== name);
    await updateDoc(doc(db, 'users', userId), { [field]: filtered });
  }
}
