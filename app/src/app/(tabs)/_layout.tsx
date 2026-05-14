import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { borderTopColor: '#E5E7EB' },
        headerStyle: { backgroundColor: '#2563EB' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '登録',
          headerTitle: '支出登録',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>＋</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '履歴',
          headerTitle: '全履歴',
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>📋</Text>
          ),
        }}
      />
    </Tabs>
  );
}
