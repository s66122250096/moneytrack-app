import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Clock, PlusCircle, PieChart, Wallet, User } from 'lucide-react-native';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TransactionHistoryScreen } from '../screens/TransactionHistoryScreen';
import { AddTransactionScreen } from '../screens/AddTransactionScreen';
import { ReportScreen } from '../screens/ReportScreen';
import { BudgetScreen } from '../screens/BudgetScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#10b981',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#e5e7eb', height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11 },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: Home,
            History: Clock,
            AddTransaction: PlusCircle,
            Report: PieChart,
            Budget: Wallet,
            Profile: User,
          };
          const IconComponent = icons[route.name];
          const iconSize = route.name === 'AddTransaction' ? 30 : size;
          const iconColor = route.name === 'AddTransaction' ? '#10b981' : color;
          return <IconComponent size={iconSize} color={iconColor} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'หน้าหลัก' }} />
      <Tab.Screen name="History" component={TransactionHistoryScreen} options={{ tabBarLabel: 'ประวัติ' }} />
      <Tab.Screen name="AddTransaction" component={AddTransactionScreen} options={{ tabBarLabel: 'เพิ่ม' }} />
      <Tab.Screen name="Report" component={ReportScreen} options={{ tabBarLabel: 'รายงาน' }} />
      <Tab.Screen name="Budget" component={BudgetScreen} options={{ tabBarLabel: 'งบประมาณ' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'โปรไฟล์' }} />
    </Tab.Navigator>
  );
}
