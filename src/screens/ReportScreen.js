import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getTransactionsByMonth, calcSummary, calcExpenseByCategory } from '../firebase/transactionService';

const { width } = Dimensions.get('window');
const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#0ea5e9', '#84cc16'];
const MONTH_NAMES = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
const MONTH_FULL = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];

// Simple SVG Pie Chart
function PieChart({ data, size = 180 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const cx = size / 2, cy = size / 2, r = size / 2 - 10;
  let cumAngle = -Math.PI / 2;
  const slices = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { path, color: d.color };
  });
  return (
    <Svg width={size} height={size}>
      {slices.map((s, i) => <Path key={i} d={s.path} fill={s.color} />)}
      <Circle cx={cx} cy={cy} r={r * 0.5} fill="#ffffff" />
    </Svg>
  );
}

export function ReportScreen() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [expenseData, setExpenseData] = useState([]);
  const [monthlyHistory, setMonthlyHistory] = useState([]);

  useFocusEffect(useCallback(() => { loadData(year, month); }, [user, year, month]));

  const loadData = async (y, m) => {
    if (!user) return;
    setLoading(true);
    try {
      const transactions = await getTransactionsByMonth(user.uid, y, m);
      setSummary(calcSummary(transactions));
      setExpenseData(calcExpenseByCategory(transactions).map((item, i) => ({ ...item, color: COLORS[i % COLORS.length] })));
      const history = await Promise.all(
        [-2, -1, 0].map(async (offset) => {
          let hm = m + offset, hy = y;
          if (hm <= 0) { hm += 12; hy -= 1; }
          const txs = await getTransactionsByMonth(user.uid, hy, hm);
          const s = calcSummary(txs);
          return { month: MONTH_NAMES[hm - 1], income: s.income, expense: s.expense };
        })
      );
      setMonthlyHistory(history);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const totalExpense = expenseData.reduce((s, i) => s + i.value, 0);
  const maxMonthly = Math.max(...monthlyHistory.flatMap(d => [d.income, d.expense]), 1);
  const barW = (width - 100) / 3 / 2 - 4;

  if (loading) return (
    <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator size="large" color="#10b981" />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header + เลือกเดือน */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>รายงาน</Text>
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={prevMonth} style={styles.monthArrow}><ChevronLeft size={20} color="#374151" /></TouchableOpacity>
            <View style={styles.monthLabelRow}>
              <Calendar size={14} color="#6b7280" />
              <Text style={styles.monthLabel}>{MONTH_FULL[month - 1]} {year}</Text>
            </View>
            <TouchableOpacity onPress={nextMonth} style={styles.monthArrow}><ChevronRight size={20} color="#374151" /></TouchableOpacity>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#10b981' }]}>
            <Text style={styles.summaryLabel}>รายรับ</Text>
            <Text style={styles.summaryAmount}>฿{summary.income.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#ef4444' }]}>
            <Text style={styles.summaryLabel}>รายจ่าย</Text>
            <Text style={styles.summaryAmount}>฿{summary.expense.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.balanceCard}>
          <TrendingUp size={20} color="#a7f3d0" />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.balanceLabel}>ยอดสุทธิ</Text>
            <Text style={[styles.balanceAmount, { color: summary.balance >= 0 ? '#ffffff' : '#fca5a5' }]}>
              {summary.balance >= 0 ? '+' : ''}฿{summary.balance.toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Pie Chart */}
        {expenseData.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>รายจ่ายตามหมวดหมู่</Text>
            <View style={styles.pieContainer}>
              <PieChart data={expenseData} size={180} />
              <View style={styles.pieLegend}>
                {expenseData.map((item) => (
                  <View key={item.name} style={styles.pieLegendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.legendName}>{item.name}</Text>
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
        ) : (
          <View style={styles.card}>
            <Text style={styles.emptyText}>ไม่มีข้อมูลรายจ่ายเดือนนี้</Text>
          </View>
        )}

        {/* Bar Chart 3 เดือน */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>เปรียบเทียบ 3 เดือน</Text>
          <View style={styles.monthlyChart}>
            {monthlyHistory.map((d) => (
              <View key={d.month} style={styles.monthGroup}>
                <View style={styles.barsRow}>
                  <View style={[styles.monthBar, { height: Math.max((d.income / maxMonthly) * 120, 2), backgroundColor: '#10b981', width: barW }]} />
                  <View style={[styles.monthBar, { height: Math.max((d.expense / maxMonthly) * 120, 2), backgroundColor: '#ef4444', width: barW }]} />
                </View>
                <Text style={styles.monthLabel2}>{d.month}</Text>
              </View>
            ))}
          </View>
          <View style={styles.chartLegend}>
            {[['#10b981', 'รายรับ'], ['#ef4444', 'รายจ่าย']].map(([c, l]) => (
              <View key={l} style={styles.chartLegendItem}>
                <View style={[styles.legendDot, { backgroundColor: c }]} />
                <Text style={styles.chartLegendText}>{l}</Text>
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
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 4 },
  summaryAmount: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  balanceCard: { backgroundColor: '#10b981', borderRadius: 20, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  balanceLabel: { color: '#a7f3d0', fontSize: 12 },
  balanceAmount: { fontSize: 28, fontWeight: 'bold' },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  pieContainer: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  pieLegend: { flex: 1, gap: 8 },
  pieLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { fontSize: 12, color: '#374151' },
  legendPct: { fontSize: 11, color: '#6b7280' },
  legendVal: { fontSize: 12, fontWeight: '600', color: '#1f2937' },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', paddingVertical: 20 },
  monthlyChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 140, marginBottom: 12 },
  monthGroup: { alignItems: 'center', gap: 6 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  monthBar: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  monthLabel2: { fontSize: 12, color: '#6b7280' },
  chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  chartLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chartLegendText: { fontSize: 13, color: '#374151' },
});
