import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from './config';

// เพิ่มรายการใหม่
export async function addTransaction(userId, data) {
  const ref = collection(db, 'users', userId, 'transactions');
  const docRef = await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// ดึงรายการทั้งหมดของ user
export async function getTransactions(userId) {
  const ref = collection(db, 'users', userId, 'transactions');
  const q = query(ref, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ดึงรายการตามเดือน
export async function getTransactionsByMonth(userId, year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  const ref = collection(db, 'users', userId, 'transactions');
  const q = query(
    ref,
    where('date', '>=', start.toISOString().split('T')[0]),
    where('date', '<=', end.toISOString().split('T')[0]),
    orderBy('date', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ลบรายการ
export async function deleteTransaction(userId, transactionId) {
  await deleteDoc(doc(db, 'users', userId, 'transactions', transactionId));
}

// คำนวณ summary (รายรับ, รายจ่าย, ยอดคงเหลือ)
export function calcSummary(transactions) {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  return { income, expense, balance: income - expense };
}

// คำนวณรายจ่ายตามหมวดหมู่
export function calcExpenseByCategory(transactions) {
  const expenses = transactions.filter((t) => t.type === 'expense');
  const map = {};
  expenses.forEach((t) => {
    map[t.category] = (map[t.category] || 0) + t.amount;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}
