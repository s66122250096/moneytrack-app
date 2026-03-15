import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp } from 'lucide-react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getTransactionsByMonth, calcSummary, calcExpenseByCategory } from '../firebase/transactionService';
import { getBudget, checkBudgetAlert, getNotificationSetting } from '../firebase/budgetService';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#0ea5e9', '#84cc16'];

function PieChart({ data, size = 160 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const cx = size / 2, cy = size / 2, r = size / 2 - 8;
  let cumAngle = -Math.PI / 2;
  const slices = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    return { path: `M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}Z`, color: d.color };
  });
  return (
    <Svg width={size} height={size}>
      {slices.map((s, i) => <Path key={i} d={s.path} fill={s.color} />)}
      <Circle cx={cx} cy={cy} r={r * 0.52} fill="#ffffff" />
    </Svg>
  );
}

export function DashboardScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [expenseData, setExpenseData] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [budgetAlert, setBudgetAlert] = useState(null);
  const [notifyEnabled, setNotifyEnabled] = useState(true);

  // รีเฟรชทุกครั้งที่กลับมาหน้านี้
  useFocusEffect(useCallback(() => {
    const now = new Date();
    loadData(now.getFullYear(), now.getMonth() + 1);
  }, [user]));

  const loadData = async (year, month) => {
    if (!user) return;
    setLoading(true);
    try {
      const [transactions, budget, notifyOn] = await Promise.all([
        getTransactionsByMonth(user.uid, year, month),
        getBudget(user.uid),
        getNotificationSetting(user.uid),
      ]);
      setNotifyEnabled(notifyOn);
      const s = calcSummary(transactions);
      setSummary(s);
      setExpenseData(
        calcExpenseByCategory(transactions).map((item, i) => ({
          ...item, color: COLORS[i % COLORS.length],
        }))
      );
      // เรียงตาม createdAt ล่าสุดก่อน แสดง 5 รายการ
      const sorted = [...transactions].sort((a, b) => {
        const ta = a.createdAt?.seconds ?? 0;
        const tb = b.createdAt?.seconds ?? 0;
        return tb - ta;
      });
      setRecentTransactions(sorted.slice(0, 5));

      // แจ้งเตือนงบ
      const alert = checkBudgetAlert(s.expense, budget);
      setBudgetAlert(alert);
      if (alert && notifyOn) {
        Alert.alert(
          alert.type === 'danger' ? 'เกินงบประมาณ!' : 'แจ้งเตือนงบประมาณ',
          alert.message,
          [{ text: 'รับทราบ' }]
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalExpense = expenseData.reduce((s, i) => s + i.value, 0);

  if (loading) return (
    <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color="#10b981" />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>สวัสดี {user?.displayName}! 👋</Text>
          <Text style={styles.headerSubtitle}>ภาพรวมการเงินของคุณ</Text>
        </View>

        {/* Budget Alert Banner */}
        {budgetAlert && (
          <View style={[styles.alertBanner, budgetAlert.type === 'danger' ? styles.alertDanger : styles.alertWarning]}>
            <Text style={styles.alertText}>{budgetAlert.message}</Text>
          </View>
        )}

        {/* Balance Card */}
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

        {/* Pie Chart รายจ่ายตามหมวดหมู่ */}
        {expenseData.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>รายจ่ายตามหมวดหมู่</Text>
              <TrendingUp size={20} color="#10b981" />
            </View>
            <View style={styles.pieContainer}>
              <PieChart data={expenseData} size={160} />
              <View style={styles.pieLegend}>
                {expenseData.map((item) => (
                  <View key={item.name} style={styles.pieLegendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.legendName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.legendPct}>
                        {totalExpense > 0 ? ((item.value / totalExpense) * 100).toFixed(1) : 0}%
                      </Text>
                    </View>
                    <Text style={styles.legendVal}>฿{item.value.toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* รายการล่าสุด */}
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
                    <Text style={styles.transactionDesc} numberOfLines={1}>{t.description || '-'}</Text>
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
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  headerSubtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  alertBanner: { borderRadius: 16, padding: 14, marginBottom: 14 },
  alertWarning: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d' },
  alertDanger: { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' },
  alertText: { fontSize: 13, color: '#1f2937', lineHeight: 20 },
  balanceCard: {
    backgroundColor: '#10b981', borderRadius: 24, padding: 24, marginBottom: 16,
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
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  pieContainer: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  pieLegend: { flex: 1, gap: 8 },
  pieLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  legendName: { fontSize: 12, color: '#374151' },
  legendPct: { fontSize: 11, color: '#6b7280' },
  legendVal: { fontSize: 12, fontWeight: '600', color: '#1f2937' },
  transactionList: { gap: 10 },
  transactionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 16, padding: 12 },
  transactionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  transactionInfo: { flex: 1 },
  transactionCategory: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  transactionDesc: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  transactionDate: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  transactionAmount: { fontSize: 14, fontWeight: 'bold' },
  emptyText: { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingVertical: 16 },
});
