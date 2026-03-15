import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, TextInput,
  StyleSheet, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { Plus, Trash2, X, Tag } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getCategories, addCategory, removeCategory } from '../firebase/categoryService';

export function CategoryScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState('expense');
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => { loadCategories(); }, [user]));

  const loadCategories = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getCategories(user.uid);
      setCategories(data);
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const name = newCat.trim();
    if (!name) { Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อหมวดหมู่'); return; }
    if (categories[tab].includes(name)) { Alert.alert('ข้อผิดพลาด', 'มีหมวดหมู่นี้แล้ว'); return; }
    setSaving(true);
    try {
      await addCategory(user.uid, tab, name);
      setCategories(prev => ({ ...prev, [tab]: [...prev[tab], name] }));
      setNewCat('');
      setAddModal(false);
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (name) => {
    if (name === 'อื่นๆ') { Alert.alert('ไม่สามารถลบได้', 'หมวดหมู่ "อื่นๆ" ไม่สามารถลบได้'); return; }
    Alert.alert('ลบหมวดหมู่', `ต้องการลบ "${name}" หรือไม่?`, [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ', style: 'destructive',
        onPress: async () => {
          try {
            await removeCategory(user.uid, tab, name);
            setCategories(prev => ({ ...prev, [tab]: prev[tab].filter(c => c !== name) }));
          } catch (e) {
            Alert.alert('เกิดข้อผิดพลาด', e.message);
          }
        },
      },
    ]);
  };

  const list = categories[tab];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>จัดการหมวดหมู่</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setNewCat(''); setAddModal(true); }}>
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Tab */}
      <View style={styles.tabRow}>
        {[{ key: 'expense', label: 'รายจ่าย' }, { key: 'income', label: 'รายรับ' }].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && (t.key === 'expense' ? styles.tabExpenseActive : styles.tabIncomeActive)]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}><ActivityIndicator size="large" color="#10b981" /></View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.catItem}>
              <View style={styles.catLeft}>
                <View style={[styles.catDot, { backgroundColor: tab === 'income' ? '#10b981' : '#ef4444' }]} />
                <Text style={styles.catName}>{item}</Text>
              </View>
              {item !== 'อื่นๆ' && (
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>ไม่มีหมวดหมู่</Text>}
        />
      )}

      {/* Modal เพิ่มหมวดหมู่ */}
      <Modal visible={addModal} transparent animationType="slide" onRequestClose={() => setAddModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เพิ่มหมวดหมู่{tab === 'income' ? 'รายรับ' : 'รายจ่าย'}</Text>
              <TouchableOpacity onPress={() => setAddModal(false)}><X size={22} color="#6b7280" /></TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>ชื่อหมวดหมู่</Text>
            <TextInput
              style={styles.modalInput} value={newCat} onChangeText={setNewCat}
              placeholder="เช่น ท่องเที่ยว, ออมเงิน..." placeholderTextColor="#9ca3af" autoFocus
            />
            <TouchableOpacity
              style={[styles.modalBtn, saving && styles.modalBtnDisabled]}
              onPress={handleAdd} disabled={saving}
            >
              <Text style={styles.modalBtnText}>{saving ? 'กำลังบันทึก...' : 'เพิ่มหมวดหมู่'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  addBtn: { backgroundColor: '#10b981', borderRadius: 12, padding: 10 },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#ffffff', borderRadius: 16, padding: 4, gap: 4, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabExpenseActive: { backgroundColor: '#ef4444' },
  tabIncomeActive: { backgroundColor: '#10b981' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  tabTextActive: { color: '#ffffff', fontWeight: '600' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 20, gap: 10 },
  catItem: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  catName: { fontSize: 15, fontWeight: '500', color: '#1f2937' },
  deleteBtn: { padding: 6 },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 14 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#ffffff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  modalLabel: { fontSize: 13, color: '#374151', marginBottom: 6 },
  modalInput: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1f2937', marginBottom: 4 },
  modalBtn: { backgroundColor: '#10b981', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  modalBtnDisabled: { backgroundColor: '#6ee7b7' },
  modalBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
