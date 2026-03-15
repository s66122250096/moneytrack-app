import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Alert, TextInput, Modal, Linking,
} from 'react-native';
import {
  User, Tag, Bell, Shield, HelpCircle, Settings,
  ChevronRight, LogOut, Pencil, X, Lock,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import {
  updateProfile, updatePassword,
  EmailAuthProvider, reauthenticateWithCredential,
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../firebase/authService';
import { auth, db } from '../firebase/config';

export function ProfileScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, expense: 0, income: 0 });

  // modal states
  const [editNameModal, setEditNameModal] = useState(false);
  const [editPasswordModal, setEditPasswordModal] = useState(false);
  const [notifyModal, setNotifyModal] = useState(false);

  // field states
  const [newName, setNewName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // โหลดสถิติจาก Firestore
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [user])
  );

  const loadStats = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        setStats(snap.data().stats || { total: 0, expense: 0, income: 0 });
      }
    } catch (e) {
      // ไม่มี stats ก็ไม่เป็นไร
    }
  };

  // ── Logout ──────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('ออกจากระบบ', 'คุณต้องการออกจากระบบหรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ออกจากระบบ', style: 'destructive', onPress: logoutUser },
    ]);
  };

  // ── แก้ไขชื่อ ────────────────────────────────────────────
  const openEditName = () => {
    setNewName(user?.displayName || '');
    setEditNameModal(true);
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) { Alert.alert('ข้อผิดพลาด', 'กรุณากรอกชื่อ'); return; }
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: newName.trim() });
      // อัปเดตใน Firestore ด้วย
      await updateDoc(doc(db, 'users', user.uid), { name: newName.trim() });
      setEditNameModal(false);
      Alert.alert('สำเร็จ', 'อัปเดตชื่อเรียบร้อย');
    } catch (e) {
      Alert.alert('เกิดข้อผิดพลาด', e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── เปลี่ยนรหัสผ่าน ──────────────────────────────────────
  const openEditPassword = () => {
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setEditPasswordModal(true);
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบ'); return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('ข้อผิดพลาด', 'รหัสผ่านใหม่ไม่ตรงกัน'); return;
    }
    if (newPassword.length < 6) {
      Alert.alert('ข้อผิดพลาด', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return;
    }
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setEditPasswordModal(false);
      Alert.alert('สำเร็จ', 'เปลี่ยนรหัสผ่านเรียบร้อย');
    } catch (e) {
      const msgs = {
        'auth/wrong-password': 'รหัสผ่านปัจจุบันไม่ถูกต้อง',
        'auth/invalid-credential': 'รหัสผ่านปัจจุบันไม่ถูกต้อง',
      };
      Alert.alert('เกิดข้อผิดพลาด', msgs[e.code] || e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── เมนูหลัก ─────────────────────────────────────────────
  const menuItems = [
    {
      Icon: Pencil, label: 'แก้ไขชื่อ',
      bgColor: '#d1fae5', iconColor: '#059669',
      onPress: openEditName,
    },
    {
      Icon: Lock, label: 'เปลี่ยนรหัสผ่าน',
      bgColor: '#dbeafe', iconColor: '#2563eb',
      onPress: openEditPassword,
    },
    {
      Icon: Tag, label: 'จัดการหมวดหมู่',
      bgColor: '#fef3c7', iconColor: '#d97706',
      onPress: () => Alert.alert('จัดการหมวดหมู่', 'ฟีเจอร์นี้จะมาเร็วๆ นี้'),
    },
    {
      Icon: Bell, label: 'การแจ้งเตือน',
      bgColor: '#ffedd5', iconColor: '#ea580c',
      onPress: () => setNotifyModal(true),
    },
    {
      Icon: Shield, label: 'ความเป็นส่วนตัว',
      bgColor: '#ede9fe', iconColor: '#7c3aed',
      onPress: () => Alert.alert('ความเป็นส่วนตัว', 'ข้อมูลของคุณถูกเก็บอย่างปลอดภัยใน Firebase และไม่ถูกแชร์กับบุคคลที่สาม'),
    },
    {
      Icon: HelpCircle, label: 'ช่วยเหลือ / ติดต่อเรา',
      bgColor: '#fce7f3', iconColor: '#be185d',
      onPress: () => Linking.openURL('mailto:support@moneytrack.app'),
    },
    {
      Icon: Settings, label: 'ตั้งค่า',
      bgColor: '#f3f4f6', iconColor: '#4b5563',
      onPress: () => Alert.alert('ตั้งค่า', 'ฟีเจอร์นี้จะมาเร็วๆ นี้'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Avatar + ชื่อ */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <User size={48} color="#ffffff" />
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{user?.displayName || 'ผู้ใช้'}</Text>
            <TouchableOpacity onPress={openEditName} style={styles.editNameBtn}>
              <Pencil size={14} color="#10b981" />
            </TouchableOpacity>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* เมนู */}
        <View style={styles.menuList}>
          {menuItems.map(({ Icon, label, bgColor, iconColor, onPress }) => (
            <TouchableOpacity key={label} style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
              <View style={[styles.menuIconBox, { backgroundColor: bgColor }]}>
                <Icon size={20} color={iconColor} />
              </View>
              <Text style={styles.menuLabel}>{label}</Text>
              <ChevronRight size={18} color="#d1d5db" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <LogOut size={20} color="#dc2626" />
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>

        <Text style={styles.version}>MoneyTrack v1.0.0</Text>
      </ScrollView>

      {/* ── Modal: แก้ไขชื่อ ── */}
      <Modal visible={editNameModal} transparent animationType="slide" onRequestClose={() => setEditNameModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>แก้ไขชื่อ</Text>
              <TouchableOpacity onPress={() => setEditNameModal(false)}>
                <X size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>ชื่อใหม่</Text>
            <TextInput
              style={styles.modalInput} value={newName} onChangeText={setNewName}
              placeholder="ชื่อของคุณ" placeholderTextColor="#9ca3af" autoFocus
            />
            <TouchableOpacity
              style={[styles.modalBtn, loading && styles.modalBtnDisabled]}
              onPress={handleUpdateName} disabled={loading}
            >
              <Text style={styles.modalBtnText}>{loading ? 'กำลังบันทึก...' : 'บันทึก'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal: เปลี่ยนรหัสผ่าน ── */}
      <Modal visible={editPasswordModal} transparent animationType="slide" onRequestClose={() => setEditPasswordModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เปลี่ยนรหัสผ่าน</Text>
              <TouchableOpacity onPress={() => setEditPasswordModal(false)}>
                <X size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {[
              { label: 'รหัสผ่านปัจจุบัน', value: currentPassword, set: setCurrentPassword },
              { label: 'รหัสผ่านใหม่', value: newPassword, set: setNewPassword },
              { label: 'ยืนยันรหัสผ่านใหม่', value: confirmPassword, set: setConfirmPassword },
            ].map((f) => (
              <View key={f.label} style={{ marginBottom: 12 }}>
                <Text style={styles.modalLabel}>{f.label}</Text>
                <TextInput
                  style={styles.modalInput} value={f.value} onChangeText={f.set}
                  secureTextEntry placeholder="••••••••" placeholderTextColor="#9ca3af"
                />
              </View>
            ))}
            <TouchableOpacity
              style={[styles.modalBtn, loading && styles.modalBtnDisabled]}
              onPress={handleUpdatePassword} disabled={loading}
            >
              <Text style={styles.modalBtnText}>{loading ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal: การแจ้งเตือน ── */}
      <Modal visible={notifyModal} transparent animationType="slide" onRequestClose={() => setNotifyModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>การแจ้งเตือน</Text>
              <TouchableOpacity onPress={() => setNotifyModal(false)}>
                <X size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.notifyText}>
              ฟีเจอร์การแจ้งเตือนจะพร้อมใช้งานเร็วๆ นี้ครับ 🔔{'\n\n'}
              จะรองรับการแจ้งเตือนเมื่อ:{'\n'}
              • ใกล้ถึงงบประมาณที่ตั้งไว้{'\n'}
              • สรุปรายจ่ายรายสัปดาห์{'\n'}
              • เตือนความจำบันทึกรายการ
            </Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setNotifyModal(false)}>
              <Text style={styles.modalBtnText}>รับทราบ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 20, paddingBottom: 32 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 90, height: 90, backgroundColor: '#10b981', borderRadius: 45,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  editNameBtn: {
    backgroundColor: '#f0fdf4', borderRadius: 8, padding: 6,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  email: { fontSize: 14, color: '#6b7280' },
  menuList: { gap: 10, marginBottom: 20 },
  menuItem: {
    backgroundColor: '#ffffff', borderRadius: 18, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  menuIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1f2937' },
  logoutButton: {
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 18,
    paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20,
  },
  logoutText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 11, color: '#9ca3af' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#ffffff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  modalLabel: { fontSize: 13, color: '#374151', marginBottom: 6 },
  modalInput: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1f2937',
  },
  modalBtn: {
    backgroundColor: '#10b981', borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginTop: 12,
  },
  modalBtnDisabled: { backgroundColor: '#6ee7b7' },
  modalBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  notifyText: { fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 8 },
});
