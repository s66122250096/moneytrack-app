import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { Wallet } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loginUser } from '../firebase/authService';

export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('ข้อผิดพลาด', 'กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }
    setLoading(true);
    try {
      await loginUser(email, password);
      // RootNavigator จะ redirect อัตโนมัติเมื่อ auth state เปลี่ยน
    } catch (error) {
      const messages = {
        'auth/user-not-found': 'ไม่พบบัญชีนี้',
        'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
        'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
        'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      };
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', messages[error.code] || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Wallet size={40} color="#ffffff" />
            </View>
            <Text style={styles.appName}>MoneyTrack</Text>
            <Text style={styles.appSubtitle}>จัดการเงินง่ายๆ ในทุกวัน</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>อีเมล</Text>
              <TextInput
                style={styles.input} value={email} onChangeText={setEmail}
                placeholder="example@email.com" placeholderTextColor="#9ca3af"
                keyboardType="email-address" autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>รหัสผ่าน</Text>
              <TextInput
                style={styles.input} value={password} onChangeText={setPassword}
                placeholder="••••••••" placeholderTextColor="#9ca3af" secureTextEntry
              />
            </View>
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin} disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.registerLink}>
            <Text style={styles.registerText}>ยังไม่มีบัญชี? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLinkText}>สมัครสมาชิก</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0fdf4' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 80, height: 80, backgroundColor: '#10b981', borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  appSubtitle: { fontSize: 14, color: '#6b7280' },
  form: { gap: 16 },
  inputGroup: { marginBottom: 4 },
  label: { fontSize: 14, color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1f2937',
  },
  loginButton: {
    backgroundColor: '#10b981', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8,
    shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  loginButtonDisabled: { backgroundColor: '#6ee7b7' },
  loginButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  registerLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  registerText: { color: '#6b7280', fontSize: 14 },
  registerLinkText: { color: '#10b981', fontSize: 14, fontWeight: '600' },
});
