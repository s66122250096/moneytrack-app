import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { user, loading } = useAuth();

  // แสดง loading ขณะเช็ค auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // ล็อกอินแล้ว → ไปหน้า Main
        <Stack.Screen name="Main" component={MainTabNavigator} />
      ) : (
        // ยังไม่ล็อกอิน → ไปหน้า Login
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
