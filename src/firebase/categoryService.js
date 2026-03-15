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
  await updateDoc(doc(db, 'users', userId), { [field]: arrayUnion(name) });
}

export async function removeCategory(userId, type, name) {
  const field = type === 'income' ? 'categoriesIncome' : 'categoriesExpense';
  await updateDoc(doc(db, 'users', userId), { [field]: arrayRemove(name) });
}
