import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { addTransaction } from '../firebase/transactionService';
import { getCategories } from '../firebase/categoryService';

export function AddTransactionScreen({ navigation }) {
  const { user } = useAuth();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [loadingCats, setLoadingCats] = useState(true);

  useFocusEffect(useCallback(() => {
    loadCategories();
    setAmount(''); setCategory(''); setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  }, [user]));

  const loadCategories = async () => {
    if (!user) return;
    setLoadingCats(true);
    try {
      const data = await getCategories(user.uid);
      setCategories(data);
    } finally {
      setLoadingCats(false);
    }
  };

  const currentCategories = categories[type] || [];

  const handleSubmit = async () => {
    if (!amount || !category) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกจำนวนเงินและเลือกหมวดหมู่');
      return;
    }
    setLoading(true);
    try {
      await addTransaction(user.uid, {
        type, amount: parseFloat(amount), category, description, date,
      });
      Alert.alert('สำเร็จ', 'บันทึกรายการเรียบร้อย', [
        { text: 'ตกลง', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>เพิ่มรายการ</Text>
          </View>

          <View style={styles.typeToggle}>
            {[{ key: 'expense', label: 'รายจ่าย', active: styles.typeButtonExpenseActive },
              { key: 'income', label: 'รายรับ', active: styles.typeButtonIncomeActive }].map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeButton, type === t.key && t.active]}
                onPress={() => { setType(t.key); setCategory(''); }}
              >
                <Text style={[styles.typeButtonText, type === t.key && styles.typeButtonTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>จำนวนเงิน (฿)</Text>
            <TextInput
              style={styles.amountInput} value={amount} onChangeText={setAmount}
              placeholder="0" placeholderTextColor="#d1d5db" keyboardType="numeric"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>หมวดหมู่</Text>
            {loadingCats ? (
              <ActivityIndicator color="#10b981" />
            ) : (
              <View style={styles.categoryGrid}>
                {currentCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>รายละเอียด</Text>
            <TextInput
              style={styles.textArea} value={description} onChangeText={setDescription}
              placeholder="เพิ่มรายละเอียด (ไม่จำเป็น)" placeholderTextColor="#9ca3af"
              multiline numberOfLines={3} textAlignVertical="top"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>วันที่ (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input} value={date} onChangeText={setDate}
              placeholder="2026-03-15" placeholderTextColor="#9ca3af"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit} disabled={loading}
          >
            <Text style={styles.submitButtonText}>{loading ? 'กำลังบันทึก...' : 'บันทึกรายการ'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  backButton: { width: 40, height: 40, backgroundColor: '#ffffff', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  typeToggle: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 20, padding: 6, marginBottom: 16, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  typeButton: { flex: 1, paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  typeButtonExpenseActive: { backgroundColor: '#ef4444' },
  typeButtonIncomeActive: { backgroundColor: '#10b981' },
  typeButtonText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  typeButtonTextActive: { color: '#ffffff', fontWeight: '600' },
  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  label: { fontSize: 14, color: '#374151', marginBottom: 10 },
  amountInput: { fontSize: 36, fontWeight: 'bold', color: '#1f2937' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 14, color: '#1f2937' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  categoryChipActive: { backgroundColor: '#d1fae5', borderColor: '#10b981' },
  categoryChipText: { fontSize: 13, color: '#6b7280' },
  categoryChipTextActive: { color: '#059669', fontWeight: '600' },
  textArea: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, fontSize: 14, color: '#1f2937', minHeight: 80 },
  submitButton: { backgroundColor: '#10b981', borderRadius: 20, paddingVertical: 18, alignItems: 'center', shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  submitButtonDisabled: { backgroundColor: '#6ee7b7' },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
