import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { ArrowUpCircle, ArrowDownCircle, Search, Trash2, Filter, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getTransactions, deleteTransaction } from '../firebase/transactionService';
import { getCategories } from '../firebase/categoryService';

export function TransactionHistoryScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterModal, setFilterModal] = useState(false);

  // filter state
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useFocusEffect(useCallback(() => { loadData(); }, [user]));

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [txs, cats] = await Promise.all([
        getTransactions(user.uid),
        getCategories(user.uid),
      ]);
      setTransactions(txs);
      setCategories(cats);
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('ลบรายการ', 'ต้องการลบรายการนี้หรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ', style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(user.uid, id);
            setTransactions(prev => prev.filter(t => t.id !== id));
          } catch (e) {
            Alert.alert('เกิดข้อผิดพลาด', e.message);
          }
        },
      },
    ]);
  };

  const clearFilters = () => {
    setFilterType('all'); setFilterCategory('');
    setFilterDateFrom(''); setFilterDateTo('');
  };

  const allCategories = [...new Set([...categories.income, ...categories.expense])];
  const hasFilter = filterType !== 'all' || filterCategory || filterDateFrom || filterDateTo;

  const filtered = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterDateFrom && t.date < filterDateFrom) return false;
    if (filterDateTo && t.date > filterDateTo) return false;
    if (search && !t.category.includes(search) && !(t.description || '').includes(search)) return false;
    return true;
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

        {/* Search + Filter */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={18} color="#9ca3af" />
            <TextInput
              style={styles.searchInput} value={search} onChangeText={setSearch}
              placeholder="ค้นหา..." placeholderTextColor="#9ca3af"
            />
          </View>
          <TouchableOpacity
            style={[styles.filterBtn, hasFilter && styles.filterBtnActive]}
            onPress={() => setFilterModal(true)}
          >
            <Filter size={18} color={hasFilter ? '#ffffff' : '#374151'} />
          </TouchableOpacity>
        </View>

        {/* Active filter badges */}
        {hasFilter && (
          <View style={styles.badgeRow}>
            {filterType !== 'all' && <View style={styles.badge}><Text style={styles.badgeText}>{filterType === 'income' ? 'รายรับ' : 'รายจ่าย'}</Text></View>}
            {filterCategory !== '' && <View style={styles.badge}><Text style={styles.badgeText}>{filterCategory}</Text></View>}
            {filterDateFrom !== '' && <View style={styles.badge}><Text style={styles.badgeText}>จาก {filterDateFrom}</Text></View>}
            {filterDateTo !== '' && <View style={styles.badge}><Text style={styles.badgeText}>ถึง {filterDateTo}</Text></View>}
            <TouchableOpacity onPress={clearFilters} style={styles.badgeClear}>
              <Text style={styles.badgeClearText}>ล้างทั้งหมด</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingBox}><ActivityIndicator size="large" color="#10b981" /></View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, filtered.length === 0 && { flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
          onRefresh={loadData}
          refreshing={loading}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>ไม่พบรายการ</Text>
              <Text style={styles.emptySubText}>ลองเปลี่ยนตัวกรองหรือเพิ่มรายการใหม่</Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal visible={filterModal} transparent animationType="slide" onRequestClose={() => setFilterModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>กรองรายการ</Text>
              <TouchableOpacity onPress={() => setFilterModal(false)}><X size={22} color="#6b7280" /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* ประเภท */}
              <Text style={styles.filterLabel}>ประเภท</Text>
              <View style={styles.filterRow}>
                {[{ key: 'all', label: 'ทั้งหมด' }, { key: 'income', label: 'รายรับ' }, { key: 'expense', label: 'รายจ่าย' }].map(f => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterChip, filterType === f.key && styles.filterChipActive]}
                    onPress={() => setFilterType(f.key)}
                  >
                    <Text style={[styles.filterChipText, filterType === f.key && styles.filterChipTextActive]}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* หมวดหมู่ */}
              <Text style={styles.filterLabel}>หมวดหมู่</Text>
              <View style={styles.filterRow}>
                <TouchableOpacity
                  style={[styles.filterChip, filterCategory === '' && styles.filterChipActive]}
                  onPress={() => setFilterCategory('')}
                >
                  <Text style={[styles.filterChipText, filterCategory === '' && styles.filterChipTextActive]}>ทั้งหมด</Text>
                </TouchableOpacity>
                {allCategories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
                    onPress={() => setFilterCategory(cat)}
                  >
                    <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* ช่วงวันที่ */}
              <Text style={styles.filterLabel}>ช่วงวันที่</Text>
              <View style={styles.dateRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateLabel}>จากวันที่</Text>
                  <TextInput
                    style={styles.dateInput} value={filterDateFrom} onChangeText={setFilterDateFrom}
                    placeholder="2026-01-01" placeholderTextColor="#9ca3af"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dateLabel}>ถึงวันที่</Text>
                  <TextInput
                    style={styles.dateInput} value={filterDateTo} onChangeText={setFilterDateTo}
                    placeholder="2026-12-31" placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>ล้างตัวกรอง</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setFilterModal(false)}>
                <Text style={styles.applyBtnText}>ใช้งาน ({filtered.length})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1f2937' },
  filterBtn: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, padding: 12, alignItems: 'center', justifyContent: 'center' },
  filterBtnActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  badge: { backgroundColor: '#d1fae5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 12, color: '#059669', fontWeight: '500' },
  badgeClear: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeClearText: { fontSize: 12, color: '#dc2626', fontWeight: '500' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#9ca3af' },
  emptySubText: { fontSize: 13, color: '#d1d5db', marginTop: 4 },
  transactionCard: { backgroundColor: '#ffffff', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  iconBox: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  transactionInfo: { flex: 1 },
  transactionCategory: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  transactionDescription: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  transactionDate: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  transactionRight: { alignItems: 'flex-end', gap: 6 },
  transactionAmount: { fontSize: 15, fontWeight: 'bold' },
  deleteButton: { padding: 4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#ffffff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 10, marginTop: 16 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  filterChipActive: { backgroundColor: '#d1fae5', borderColor: '#10b981' },
  filterChipText: { fontSize: 13, color: '#6b7280' },
  filterChipTextActive: { color: '#059669', fontWeight: '600' },
  dateRow: { flexDirection: 'row', gap: 12 },
  dateLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  dateInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 10, fontSize: 14, color: '#1f2937' },
  modalFooter: { flexDirection: 'row', gap: 10, marginTop: 20 },
  clearBtn: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  clearBtnText: { color: '#374151', fontWeight: '600' },
  applyBtn: { flex: 1, backgroundColor: '#10b981', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  applyBtnText: { color: '#ffffff', fontWeight: '600' },
});
