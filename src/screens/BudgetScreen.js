import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Pencil, Trophy, AlertCircle, Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getBudget, updateBudget } from '../firebase/budgetService';
import { getTransactionsByMonth, calcSummary, calcExpenseByCategory } from '../firebase/transactionService';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];

export function BudgetScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(0);
  const [editValue, setEditValue] = useState('');
  const [currentExpense, setCurrentExpense] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user])
  );

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const now = new Date();
      const [budget, transactions] = await Promise.all([
        getBudget(user.uid),
        getTransactionsByMonth(user.uid, now.getFullYear(), now.getMonth() + 1),
      ]);
      const { expense } = calcSummary(transactions);
      const byCategory = calcExpenseByCategory(transactions).map((item, i) => ({
        ...item,
        budget: Math.round(budget * 0.3), // ตัวอย่าง: แต่ละหมวด 30% ของงบ
        color: COLORS[i % COLORS.length],
      }));
      setBudgetAmount(budget);
      setEditValue(String(budget));
      setCurrentExpense(expense);
      setCategoryBudgets(byCategory);
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBudget = async () => {
    const newBudget = parseFloat(editValue);
    if (!newBudget || newBudget <= 0) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกจำนวนเงินที่ถูกต้อง');
      return;
    }
    try {
      await updateBudget(user.uid, newBudget);
      setBudgetAmount(newBudget);
      setEditingBudget(false);
      Alert.alert('สำเร็จ', 'อัปเดตงบประมาณเรียบร้อย');
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', error.message);
    }
  };

  const percentage = budgetAmount > 0 ? (currentExpense / budgetAmount) * 100 : 0;
  const remaining = budgetAmount - currentExpense;
  const isWarning = percentage >= 80;

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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>งบประมาณ</Text>
          <TouchableOpacity onPress={() => editingBudget ? handleSaveBudget() : setEditingBudget(true)}>
            {editingBudget
              ? <Check size={22} color="#10b981" />
              : <Pencil size={22} color="#10b981" />
            }
          </TouchableOpacity>
        </View>

        <View style={[styles.budgetCard, { backgroundColor: isWarning ? '#ef4444' : '#10b981' }]}>
          <View style={styles.budgetCardHeader}>
            <Trophy size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.budgetCardLabel}>งบประมาณรายเดือน</Text>
          </View>
          {editingBudget ? (
            <View style={styles.editRow}>
              <Text style={styles.bahtSign}>฿</Text>
              <TextInput
                style={styles.budgetInput} value={editValue}
                onChangeText={setEditValue} keyboardType="numeric"
                autoFocus selectTextOnFocus
              />
            </View>
          ) : (
            <Text style={styles.budgetAmount}>฿{budgetAmount.toLocaleString()}</Text>
          )}
          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>ใช้ไป ฿{currentExpense.toLocaleString()}</Text>
              <Text style={styles.progressText}>{percentage.toFixed(1)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${Math.min(percentage, 100)}%` }]} />
            </View>
          </View>
          <View style={styles.remainingRow}>
            <View>
              <Text style={styles.remainingLabel}>คงเหลือ</Text>
              <Text style={styles.remainingAmount}>฿{remaining.toLocaleString()}</Text>
            </View>
            {isWarning && (
              <View style={styles.warningBadge}>
                <AlertCircle size={14} color="#ffffff" />
                <Text style={styles.warningText}>ใกล้เกินงบ!</Text>
              </View>
            )}
          </View>
        </View>

        {categoryBudgets.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>รายจ่ายตามหมวดหมู่เดือนนี้</Text>
            <View style={styles.categoryList}>
              {categoryBudgets.map((item) => {
                const pct = item.budget > 0 ? (item.value / item.budget) * 100 : 100;
                const isOver = pct >= 100;
                const isNear = pct >= 80 && !isOver;
                return (
                  <View key={item.name} style={styles.categoryCard}>
                    <View style={styles.categoryCardHeader}>
                      <View style={styles.categoryLeft}>
                        <View style={[styles.dot, { backgroundColor: item.color }]} />
                        <Text style={styles.categoryName}>{item.name}</Text>
                      </View>
                      <Text style={[styles.categoryStatus, { color: isOver ? '#dc2626' : isNear ? '#ea580c' : '#6b7280' }]}>
                        ฿{item.value.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.categoryBarBg}>
                      <View style={[styles.categoryBarFill, {
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: isOver ? '#ef4444' : isNear ? '#f97316' : item.color,
                      }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>💡</Text>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>เคล็ดลับ</Text>
            <Text style={styles.tipText}>กดไอคอนดินสอเพื่อแก้ไขงบประมาณรายเดือนของคุณได้ตลอดเวลา</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  budgetCard: {
    borderRadius: 24, padding: 24, marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
  },
  budgetCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  budgetCardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  budgetAmount: { color: '#ffffff', fontSize: 36, fontWeight: 'bold', marginBottom: 20 },
  editRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  bahtSign: { color: '#ffffff', fontSize: 24, marginRight: 4 },
  budgetInput: {
    backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff', fontSize: 28,
    fontWeight: 'bold', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, minWidth: 140,
  },
  progressSection: { marginBottom: 16 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  progressBarBg: { height: 10, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#ffffff', borderRadius: 5 },
  remainingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  remainingLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  remainingAmount: { color: '#ffffff', fontSize: 22, fontWeight: 'bold' },
  warningBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4,
  },
  warningText: { color: '#ffffff', fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  categoryList: { gap: 10, marginBottom: 16 },
  categoryCard: {
    backgroundColor: '#ffffff', borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  categoryCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  categoryName: { fontSize: 14, fontWeight: '500', color: '#1f2937' },
  categoryStatus: { fontSize: 13, fontWeight: '600' },
  categoryBarBg: { height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' },
  categoryBarFill: { height: '100%', borderRadius: 3 },
  tipCard: {
    backgroundColor: '#f0fdf4', borderRadius: 18, padding: 16,
    flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: '#bbf7d0',
  },
  tipEmoji: { fontSize: 20 },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 14, fontWeight: 'bold', color: '#064e3b', marginBottom: 4 },
  tipText: { fontSize: 13, color: '#065f46', lineHeight: 18 },
});
