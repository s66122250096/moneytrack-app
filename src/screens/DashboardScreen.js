import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getTransactionsByMonth, calcSummary, calcExpenseByCategory } from '../firebase/transactionService';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];

export function DashboardScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [expenseData, setExpenseData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // รีเฟรชทุกครั้งที่กลับมาหน้านี้ — เหมือนหน้าอื่นๆ
  useFocusEffect(
    useCallback(() => {
      const now = new Date();
      loadData(now.getFullYear(), now.getMonth() + 1);
    }, [user])
  );

  const loadData = async (year, month) => {
    if (!user) return;
    setLoading(true);
    try {
      const transactions = await getTransactionsByMonth(user.uid, year, month);
      setSummary(calcSummary(transactions));
      setExpenseData(
        calcExpenseByCategory(transactions).map((item, i) => ({
          ...item, color: COLORS[i % COLORS.length],
        }))
      );
      setRecentTransactions(transactions.slice(0, 5));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const totalExpense = expenseData.reduce((sum, i) => sum + i.value, 0);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>สวัสดี {user?.displayName}! 👋</Text>
          <Text style={styles.headerSubtitle}>ภาพรวมการเงินของคุณ</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>ยอดเงินคงเหลือ</Text>
          <Text style={styles.balanceAmount}>฿{summary.balance.toLocaleString()}</Text>
          <View style={styles.incomeExpenseRow}>
            <View style={styles.incomeExpenseBox}>
              <View style={styles.incomeExpenseHeader}>
                <ArrowUpCircle size={16} color="#a7f3d0" />
                <Text style={styles.incomeExpenseLabel}>รายรับ</Text>
              </View>
              <Text style={styles.incomeExpenseAmount}>฿{summary.income.toLocaleString()}</Text>
            </View>
            <View style={styles.incomeExpenseBox}>
              <View style={styles.incomeExpenseHeader}>
                <ArrowDownCircle size={16} color="#a7f3d0" />
                <Text style={styles.incomeExpenseLabel}>รายจ่าย</Text>
              </View>
              <Text style={styles.incomeExpenseAmount}>฿{summary.expense.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {expenseData.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>รายจ่ายตามหมวดหมู่</Text>
              <TrendingUp size={20} color="#10b981" />
            </View>
            {expenseData.map((item) => {
              const pct = totalExpense > 0 ? ((item.value / totalExpense) * 100).toFixed(0) : 0;
              return (
                <View key={item.name} style={styles.categoryRow}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.dot, { backgroundColor: item.color }]} />
                    <Text style={styles.categoryName}>{item.name}</Text>
                  </View>
                  <View style={styles.categoryRight}>
                    <View style={styles.categoryBarBg}>
                      <View style={[styles.categoryBarFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                    </View>
                    <Text style={styles.categoryAmount}>฿{item.value.toLocaleString()}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>รายการล่าสุด</Text>
          {recentTransactions.length === 0 ? (
            <Text style={styles.emptyText}>ยังไม่มีรายการ กด + เพื่อเพิ่มรายการแรก</Text>
          ) : (
            <View style={styles.transactionList}>
              {recentTransactions.map((t) => (
                <View key={t.id} style={styles.transactionRow}>
                  <View style={[styles.transactionIcon, { backgroundColor: t.type === 'income' ? '#d1fae5' : '#fee2e2' }]}>
                    {t.type === 'income'
                      ? <ArrowUpCircle size={20} color="#059669" />
                      : <ArrowDownCircle size={20} color="#dc2626" />
                    }
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionCategory}>{t.category}</Text>
                    <Text style={styles.transactionDate}>{t.date}</Text>
                  </View>
                  <Text style={[styles.transactionAmount, { color: t.type === 'income' ? '#059669' : '#dc2626' }]}>
                    {t.type === 'income' ? '+' : '-'}฿{t.amount.toLocaleString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 20, paddingBottom: 32 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  headerSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  balanceCard: {
    backgroundColor: '#10b981', borderRadius: 24, padding: 24, marginBottom: 20,
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  balanceLabel: { color: '#a7f3d0', fontSize: 13, marginBottom: 4 },
  balanceAmount: { color: '#ffffff', fontSize: 36, fontWeight: 'bold', marginBottom: 20 },
  incomeExpenseRow: { flexDirection: 'row', gap: 12 },
  incomeExpenseBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: 14 },
  incomeExpenseHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  incomeExpenseLabel: { color: '#a7f3d0', fontSize: 11 },
  incomeExpenseAmount: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  card: {
    backgroundColor: '#ffffff', borderRadius: 24, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', width: 80, gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { fontSize: 13, color: '#374151' },
  categoryRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryBarBg: { flex: 1, height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  categoryBarFill: { height: '100%', borderRadius: 3 },
  categoryAmount: { fontSize: 12, fontWeight: '600', color: '#1f2937', width: 60, textAlign: 'right' },
  transactionList: { gap: 10 },
  transactionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 16, padding: 12 },
  transactionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  transactionInfo: { flex: 1 },
  transactionCategory: { fontSize: 14, fontWeight: '500', color: '#1f2937' },
  transactionDate: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  transactionAmount: { fontSize: 14, fontWeight: 'bold' },
  emptyText: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 16 },
});
