import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { Wallet } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { registerUser } from '../firebase/authService';

export function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('ข้อผิดพลาด', 'รหัสผ่านไม่ตรงกัน');
      return;
    }
    if (password.length < 6) {
      Alert.alert('ข้อผิดพลาด', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setLoading(true);
    try {
      await registerUser(name, email, password);
      // RootNavigator redirect อัตโนมัติ
    } catch (error) {
      const messages = {
        'auth/email-already-in-use': 'อีเมลนี้ถูกใช้งานแล้ว',
        'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
        'auth/weak-password': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
      };
      Alert.alert('สมัครสมาชิกไม่สำเร็จ', messages[error.code] || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Wallet size={32} color="#ffffff" />
            </View>
            <Text style={styles.appName}>สมัครสมาชิก</Text>
            <Text style={styles.appSubtitle}>เริ่มต้นจัดการการเงินของคุณ</Text>
          </View>

          <View style={styles.form}>
            {[
              { label: 'ชื่อ', value: name, set: setName, placeholder: 'ชื่อของคุณ' },
              { label: 'อีเมล', value: email, set: setEmail, placeholder: 'example@email.com', type: 'email-address' },
              { label: 'รหัสผ่าน', value: password, set: setPassword, placeholder: '••••••••', secure: true },
              { label: 'ยืนยันรหัสผ่าน', value: confirmPassword, set: setConfirmPassword, placeholder: '••••••••', secure: true },
            ].map((field) => (
              <View key={field.label} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={styles.input} value={field.value} onChangeText={field.set}
                  placeholder={field.placeholder} placeholderTextColor="#9ca3af"
                  keyboardType={field.type || 'default'}
                  autoCapitalize={field.type === 'email-address' ? 'none' : 'sentences'}
                  secureTextEntry={!!field.secure}
                />
              </View>
            ))}
            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister} disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loginLink}>
            <Text style={styles.loginText}>มีบัญชีอยู่แล้ว? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLinkText}>เข้าสู่ระบบ</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 24 },
  logoBox: {
    width: 64, height: 64, backgroundColor: '#10b981', borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  appName: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  appSubtitle: { fontSize: 13, color: '#6b7280' },
  form: { gap: 12 },
  inputGroup: { marginBottom: 2 },
  label: { fontSize: 13, color: '#374151', marginBottom: 6 },
  input: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1f2937',
  },
  registerButton: {
    backgroundColor: '#10b981', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8,
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  registerButtonDisabled: { backgroundColor: '#6ee7b7' },
  registerButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { color: '#6b7280', fontSize: 13 },
  loginLinkText: { color: '#10b981', fontSize: 13, fontWeight: '600' },
});
