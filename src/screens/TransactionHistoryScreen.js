import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { ArrowUpCircle, ArrowDownCircle, Search, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getTransactions, deleteTransaction } from '../firebase/transactionService';

export function TransactionHistoryScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // โหลดใหม่ทุกครั้งที่กลับมาหน้านี้
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [user])
  );

  const loadTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getTransactions(user.uid);
      setTransactions(data);
    } catch (error) {
      Alert.alert('เกิดข้อผิดพลาด', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('ลบรายการ', 'คุณต้องการลบรายการนี้หรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ', style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(user.uid, id);
            setTransactions((prev) => prev.filter((t) => t.id !== id));
          } catch (error) {
            Alert.alert('เกิดข้อผิดพลาด', error.message);
          }
        },
      },
    ]);
  };

  const filtered = transactions.filter((t) => {
    const matchFilter = filter === 'all' || t.type === filter;
    const matchSearch = t.category.includes(search) || (t.description || '').includes(search);
    return matchFilter && matchSearch;
  });

  const renderItem = ({ item: t }) => (
    <View style={styles.transactionCard}>
      <View style={[styles.iconBox, { backgroundColor: t.type === 'income' ? '#d1fae5' : '#fee2e2' }]}>
        {t.type === 'income'
          ? <ArrowUpCircle size={24} color="#059669" />
          : <ArrowDownCircle size={24} color="#dc2626" />
        }
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionCategory}>{t.category}</Text>
        <Text style={styles.transactionDescription}>{t.description || '-'}</Text>
        <Text style={styles.transactionDate}>{t.date}</Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, { color: t.type === 'income' ? '#059669' : '#dc2626' }]}>
          {t.type === 'income' ? '+' : '-'}฿{t.amount.toLocaleString()}
        </Text>
        <TouchableOpacity onPress={() => handleDelete(t.id)} style={styles.deleteButton}>
          <Trash2 size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ประวัติรายการ</Text>
        <View style={styles.searchBox}>
          <Search size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput} value={search} onChangeText={setSearch}
            placeholder="ค้นหารายการ..." placeholderTextColor="#9ca3af"
          />
        </View>
        <View style={styles.filterRow}>
          {[{ key: 'all', label: 'ทั้งหมด' }, { key: 'income', label: 'รายรับ' }, { key: 'expense', label: 'รายจ่าย' }].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterButton, filter === f.key && (f.key === 'expense' ? styles.filterExpenseActive : styles.filterIncomeActive)]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterButtonText, filter === f.key && styles.filterButtonTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, filtered.length === 0 && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>ไม่มีรายการ</Text>
              <Text style={styles.emptySubText}>กด + เพื่อเพิ่มรายการแรก</Text>
            </View>
          }
          onRefresh={loadTransactions}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 20, paddingBottom: 0 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 14 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 10, gap: 8, marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1f2937' },
  filterRow: {
    flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 16,
    padding: 4, gap: 4, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  filterButton: { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: 'center' },
  filterIncomeActive: { backgroundColor: '#10b981' },
  filterExpenseActive: { backgroundColor: '#ef4444' },
  filterButtonText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  filterButtonTextActive: { color: '#ffffff', fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 10 },
  emptyList: { flexGrow: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#9ca3af' },
  emptySubText: { fontSize: 13, color: '#d1d5db', marginTop: 4 },
  transactionCard: {
    backgroundColor: '#ffffff', borderRadius: 18, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  iconBox: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  transactionInfo: { flex: 1 },
  transactionCategory: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  transactionDescription: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  transactionDate: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  transactionRight: { alignItems: 'flex-end', gap: 6 },
  transactionAmount: { fontSize: 15, fontWeight: 'bold' },
  deleteButton: { padding: 4 },
});
