import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, TextInput, Modal, Switch, Image } from "react-native";
import { Tag, Bell, ChevronRight, LogOut, X, Lock, Camera } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../firebase/authService";
import { getNotificationSetting, setNotificationSetting } from "../firebase/budgetService";
import { auth, db } from "../firebase/config";

export function ProfileScreen({ navigation }) {
  const { user } = useAuth();

  // modal states
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [editPasswordModal, setEditPasswordModal] = useState(false);
  const [notifyModal, setNotifyModal] = useState(false);

  // fields
  const [newName, setNewName] = useState("");
  const [avatarUri, setAvatarUri] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [user]),
  );

  const loadSettings = async () => {
    if (!user) return;
    const enabled = await getNotificationSetting(user.uid);
    setNotifyEnabled(enabled);
    if (user.photoURL) setAvatarUri(user.photoURL);
  };

  // ── Logout ──────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert("ออกจากระบบ", "คุณต้องการออกจากระบบหรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      { text: "ออกจากระบบ", style: "destructive", onPress: logoutUser },
    ]);
  };

  // ── เปิด modal แก้ไขโปรไฟล์ ─────────────────────────────
  const openEditProfile = () => {
    setNewName(user?.displayName || "");
    setAvatarUri(user?.photoURL || null);
    setEditProfileModal(true);
  };

  // ── เลือกรูป ─────────────────────────────────────────────
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("ไม่มีสิทธิ์", "กรุณาอนุญาตการเข้าถึงคลังรูปภาพ");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  // ── บันทึกโปรไฟล์ ────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!newName.trim()) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกชื่อ");
      return;
    }
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: newName.trim(),
        photoURL: avatarUri || null,
      });
      await updateDoc(doc(db, "users", user.uid), { name: newName.trim() });
      setEditProfileModal(false);
      Alert.alert("สำเร็จ", "อัปเดตโปรไฟล์เรียบร้อย");
    } catch (e) {
      Alert.alert("เกิดข้อผิดพลาด", e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── เปลี่ยนรหัสผ่าน ──────────────────────────────────────
  const openEditPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setEditPasswordModal(true);
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("ข้อผิดพลาด", "กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("ข้อผิดพลาด", "รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("ข้อผิดพลาด", "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setEditPasswordModal(false);
      Alert.alert("สำเร็จ", "เปลี่ยนรหัสผ่านเรียบร้อย");
    } catch (e) {
      const msgs = {
        "auth/wrong-password": "รหัสผ่านปัจจุบันไม่ถูกต้อง",
        "auth/invalid-credential": "รหัสผ่านปัจจุบันไม่ถูกต้อง",
      };
      Alert.alert("เกิดข้อผิดพลาด", msgs[e.code] || e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── toggle แจ้งเตือน ─────────────────────────────────────
  const handleToggleNotify = async (value) => {
    setNotifyEnabled(value);
    await setNotificationSetting(user.uid, value);
  };

  const displayName = user?.displayName || "ผู้ใช้";
  const photoURL = user?.photoURL || null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar + ชื่อ */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={openEditProfile} style={styles.avatarWrapper}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              <Camera size={14} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <TouchableOpacity style={styles.editProfileBtn} onPress={openEditProfile}>
            <Text style={styles.editProfileBtnText}>แก้ไขโปรไฟล์</Text>
          </TouchableOpacity>
        </View>

        {/* เมนู */}
        <View style={styles.menuList}>
          {/* จัดการหมวดหมู่ */}
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Category")} activeOpacity={0.7}>
            <View style={[styles.menuIconBox, { backgroundColor: "#fef3c7" }]}>
              <Tag size={20} color="#d97706" />
            </View>
            <Text style={styles.menuLabel}>จัดการหมวดหมู่</Text>
            <ChevronRight size={18} color="#d1d5db" />
          </TouchableOpacity>

          {/* เปลี่ยนรหัสผ่าน */}
          <TouchableOpacity style={styles.menuItem} onPress={openEditPassword} activeOpacity={0.7}>
            <View style={[styles.menuIconBox, { backgroundColor: "#dbeafe" }]}>
              <Lock size={20} color="#2563eb" />
            </View>
            <Text style={styles.menuLabel}>เปลี่ยนรหัสผ่าน</Text>
            <ChevronRight size={18} color="#d1d5db" />
          </TouchableOpacity>

          {/* การแจ้งเตือน — มี Switch */}
          <TouchableOpacity style={styles.menuItem} onPress={() => setNotifyModal(true)} activeOpacity={0.7}>
            <View style={[styles.menuIconBox, { backgroundColor: "#ffedd5" }]}>
              <Bell size={20} color="#ea580c" />
            </View>
            <Text style={styles.menuLabel}>การแจ้งเตือน</Text>
            <Switch value={notifyEnabled} onValueChange={handleToggleNotify} trackColor={{ false: "#e5e7eb", true: "#6ee7b7" }} thumbColor={notifyEnabled ? "#10b981" : "#9ca3af"} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <LogOut size={20} color="#dc2626" />
          <Text style={styles.logoutText}>ออกจากระบบ</Text>
        </TouchableOpacity>

        <Text style={styles.version}>MoneyTrack v1.2.1</Text>
      </ScrollView>

      {/* ── Modal: แก้ไขโปรไฟล์ ── */}
      <Modal visible={editProfileModal} transparent animationType="slide" onRequestClose={() => setEditProfileModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>แก้ไขโปรไฟล์</Text>
              <TouchableOpacity onPress={() => setEditProfileModal(false)}>
                <X size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* รูปโปรไฟล์ */}
            <View style={styles.modalAvatarRow}>
              <TouchableOpacity onPress={handlePickImage} style={styles.modalAvatarWrapper}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.modalAvatar} />
                ) : (
                  <View style={styles.modalAvatarPlaceholder}>
                    <Text style={styles.modalAvatarInitial}>{(newName || "U").charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.modalCameraBtn}>
                  <Camera size={16} color="#ffffff" />
                </View>
              </TouchableOpacity>
              <Text style={styles.modalAvatarHint}>กดเพื่อเปลี่ยนรูปโปรไฟล์</Text>
            </View>

            <Text style={styles.modalLabel}>ชื่อ</Text>
            <TextInput style={styles.modalInput} value={newName} onChangeText={setNewName} placeholder="ชื่อของคุณ" placeholderTextColor="#9ca3af" />
            <TouchableOpacity style={[styles.modalBtn, loading && styles.modalBtnDisabled]} onPress={handleSaveProfile} disabled={loading}>
              <Text style={styles.modalBtnText}>{loading ? "กำลังบันทึก..." : "บันทึก"}</Text>
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
              { label: "รหัสผ่านปัจจุบัน", value: currentPassword, set: setCurrentPassword },
              { label: "รหัสผ่านใหม่", value: newPassword, set: setNewPassword },
              { label: "ยืนยันรหัสผ่านใหม่", value: confirmPassword, set: setConfirmPassword },
            ].map((f) => (
              <View key={f.label} style={{ marginBottom: 12 }}>
                <Text style={styles.modalLabel}>{f.label}</Text>
                <TextInput style={styles.modalInput} value={f.value} onChangeText={f.set} secureTextEntry placeholder="••••••••" placeholderTextColor="#9ca3af" />
              </View>
            ))}
            <TouchableOpacity style={[styles.modalBtn, loading && styles.modalBtnDisabled]} onPress={handleUpdatePassword} disabled={loading}>
              <Text style={styles.modalBtnText}>{loading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}</Text>
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
            <View style={styles.notifyRow}>
              <View style={styles.notifyInfo}>
                <Text style={styles.notifyTitle}>แจ้งเตือนเกินงบประมาณ</Text>
                <Text style={styles.notifyDesc}>แจ้งเตือนเมื่อใช้จ่ายถึง 80% และเมื่อเกินงบที่ตั้งไว้</Text>
              </View>
              <Switch value={notifyEnabled} onValueChange={handleToggleNotify} trackColor={{ false: "#e5e7eb", true: "#6ee7b7" }} thumbColor={notifyEnabled ? "#10b981" : "#9ca3af"} />
            </View>
            <View style={[styles.notifyStatus, { backgroundColor: notifyEnabled ? "#f0fdf4" : "#f9fafb" }]}>
              <Text style={[styles.notifyStatusText, { color: notifyEnabled ? "#059669" : "#9ca3af" }]}>{notifyEnabled ? "🔔 การแจ้งเตือนเปิดอยู่" : "🔕 การแจ้งเตือนปิดอยู่"}</Text>
            </View>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setNotifyModal(false)}>
              <Text style={styles.modalBtnText}>เสร็จสิ้น</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scrollContent: { padding: 20, paddingBottom: 32 },

  avatarSection: { alignItems: "center", marginBottom: 28 },
  avatarWrapper: { position: "relative", marginBottom: 12 },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  avatarInitial: { fontSize: 36, fontWeight: "bold", color: "#ffffff" },
  cameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#10b981",
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  name: { fontSize: 22, fontWeight: "bold", color: "#1f2937", marginBottom: 2 },
  email: { fontSize: 14, color: "#6b7280", marginBottom: 12 },
  editProfileBtn: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  editProfileBtnText: { color: "#059669", fontWeight: "600", fontSize: 14 },

  menuList: { gap: 10, marginBottom: 20 },
  menuItem: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500", color: "#1f2937" },

  logoutButton: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  logoutText: { color: "#dc2626", fontSize: 15, fontWeight: "600" },
  version: { textAlign: "center", fontSize: 11, color: "#9ca3af" },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#ffffff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#1f2937" },
  modalLabel: { fontSize: 13, color: "#374151", marginBottom: 6 },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1f2937",
  },
  modalBtn: { backgroundColor: "#10b981", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 12 },
  modalBtnDisabled: { backgroundColor: "#6ee7b7" },
  modalBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },

  // Modal avatar
  modalAvatarRow: { alignItems: "center", marginBottom: 20 },
  modalAvatarWrapper: { position: "relative" },
  modalAvatar: { width: 80, height: 80, borderRadius: 40 },
  modalAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
  },
  modalAvatarInitial: { fontSize: 32, fontWeight: "bold", color: "#ffffff" },
  modalCameraBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#10b981",
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  modalAvatarHint: { fontSize: 12, color: "#6b7280", marginTop: 8 },

  // Notification modal
  notifyRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  notifyInfo: { flex: 1 },
  notifyTitle: { fontSize: 15, fontWeight: "600", color: "#1f2937" },
  notifyDesc: { fontSize: 12, color: "#6b7280", marginTop: 2, lineHeight: 16 },
  notifyStatus: { borderRadius: 12, padding: 12, marginBottom: 4 },
  notifyStatusText: { fontSize: 13, fontWeight: "500", textAlign: "center" },
});
