import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getTransactionsByMonth, calcSummary, calcExpenseByCategory } from '../firebase/transactionService';

const { width } = Dimensions.get('window');
const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];
const MONTH_NAMES = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const MONTH_FULL = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

export function ReportScreen() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [expenseData, setExpenseData] = useState([]);
  const [monthlyHistory, setMonthlyHistory] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadData(year, month);
    }, [user, year, month])
  );

  const loadData = async (y, m) => {
    if (!user) return;
    setLoading(true);
    try {
      // โหลดเดือนปัจจุบัน
      const transactions = await getTransactionsByMonth(user.uid, y, m);
      setSummary(calcSummary(transactions));
      setExpenseData(
        calcExpenseByCategory(transactions).map((item, i) => ({
          ...item, color: COLORS[i % COLORS.length],
        }))
      );

      // โหลด 3 เดือนย้อนหลังสำหรับ bar chart
      const history = await Promise.all(
        [-2, -1, 0].map(async (offset) => {
          let hm = m + offset;
          let hy = y;
          if (hm <= 0) { hm += 12; hy -= 1; }
          const txs = await getTransactionsByMonth(user.uid, hy, hm);
          const s = calcSummary(txs);
          return { month: MONTH_NAMES[hm - 1], income: s.income, expense: s.expense };
        })
      );
      setMonthlyHistory(history);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const totalExpense = expenseData.reduce((sum, i) => sum + i.value, 0);
  const maxMonthly = Math.max(...monthlyHistory.flatMap((d) => [d.income, d.expense]), 1);
  const barWidth = (width - 100) / 3 / 2 - 4;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header + Month Selector */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>รายงาน</Text>
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}>
              <ChevronLeft size={20} color="#374151" />
            </TouchableOpacity>
            <View style={styles.monthLabelRow}>
              <Calendar size={14} color="#6b7280" />
              <Text style={styles.monthLabel}>{MONTH_FULL[month - 1]} {year}</Text>
            </View>
            <TouchableOpacity onPress={nextMonth} style={styles.monthArrow}>
              <ChevronRight size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#10b981' }]}>
            <Text style={styles.summaryCardLabel}>รายรับ</Text>
            <Text style={styles.summaryCardAmount}>฿{summary.income.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#ef4444' }]}>
            <Text style={styles.summaryCardLabel}>รายจ่าย</Text>
            <Text style={styles.summaryCardAmount}>฿{summary.expense.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.balanceCard}>
          <TrendingUp size={20} color="#a7f3d0" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.balanceLabel}>ยอดสุทธิเดือนนี้</Text>
            <Text style={[styles.balanceAmount, { color: summary.balance >= 0 ? '#ffffff' : '#fca5a5' }]}>
              {summary.balance >= 0 ? '+' : ''}฿{summary.balance.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Expense by Category */}
        {expenseData.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>รายจ่ายตามหมวดหมู่</Text>
            <View style={styles.chartContainer}>
              {expenseData.map((item) => {
                const pct = totalExpense > 0 ? (item.value / totalExpense) * 100 : 0;
                return (
                  <View key={item.name} style={styles.barRow}>
                    <Text style={styles.barLabel}>{item.name}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                    </View>
                    <Text style={styles.barValue}>฿{item.value.toLocaleString()}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.legendGrid}>
              {expenseData.map((item) => (
                <View key={item.name} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendName}>{item.name}</Text>
                  <Text style={styles.legendPct}>{totalExpense > 0 ? ((item.value / totalExpense) * 100).toFixed(1) : 0}%</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.emptyText}>ไม่มีข้อมูลรายจ่ายเดือนนี้</Text>
          </View>
        )}

        {/* Monthly Bar Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>เปรียบเทียบ 3 เดือนล่าสุด</Text>
          <View style={styles.monthlyChart}>
            {monthlyHistory.map((d) => (
              <View key={d.month} style={styles.monthGroup}>
                <View style={styles.barsRow}>
                  <View style={[styles.monthBar, { height: (d.income / maxMonthly) * 120, backgroundColor: '#10b981', width: barWidth }]} />
                  <View style={[styles.monthBar, { height: (d.expense / maxMonthly) * 120, backgroundColor: '#ef4444', width: barWidth }]} />
                </View>
                <Text style={styles.monthLabel2}>{d.month}</Text>
              </View>
            ))}
          </View>
          <View style={styles.chartLegend}>
            {[['#10b981', 'รายรับ'], ['#ef4444', 'รายจ่าย']].map(([color, label]) => (
              <View key={label} style={styles.chartLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <Text style={styles.chartLegendText}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 20, paddingBottom: 32 },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', borderRadius: 16, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  monthArrow: { padding: 4 },
  monthLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  monthLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  summaryCard: { flex: 1, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  summaryCardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 },
  summaryCardAmount: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  balanceCard: {
    backgroundColor: '#10b981', borderRadius: 20, padding: 20, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  balanceLabel: { color: '#a7f3d0', fontSize: 12 },
  balanceAmount: { fontSize: 28, fontWeight: 'bold' },
  card: {
    backgroundColor: '#ffffff', borderRadius: 24, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  chartContainer: { gap: 10, marginBottom: 16 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { width: 64, fontSize: 12, color: '#374151' },
  barTrack: { flex: 1, height: 8, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barValue: { width: 72, fontSize: 12, fontWeight: '600', color: '#1f2937', textAlign: 'right' },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '47%' },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { fontSize: 12, color: '#374151', flex: 1 },
  legendPct: { fontSize: 11, color: '#6b7280' },
  monthlyChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 140, marginBottom: 12 },
  monthGroup: { alignItems: 'center', gap: 6 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  monthBar: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  monthLabel2: { fontSize: 12, color: '#6b7280' },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  chartLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chartLegendText: { fontSize: 13, color: '#374151' },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', paddingVertical: 20 },
});
