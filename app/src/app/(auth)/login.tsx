import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch {
      Alert.alert('エラー', 'ログインに失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-8">
      <Text className="text-4xl font-bold text-gray-800 mb-2">家計簿</Text>
      <Text className="text-base text-gray-500 mb-16">日々の支出を記録しよう</Text>

      <TouchableOpacity
        onPress={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex-row items-center justify-center bg-white border border-gray-300 rounded-xl py-4 px-6 shadow-sm active:opacity-70"
      >
        {loading ? (
          <ActivityIndicator size="small" color="#4285F4" />
        ) : (
          <>
            <Text className="text-2xl mr-3">G</Text>
            <Text className="text-base font-medium text-gray-700">
              Googleでログイン
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
