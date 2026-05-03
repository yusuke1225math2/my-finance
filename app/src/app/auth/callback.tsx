import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  useEffect(() => {
    const url = Linking.useURL();
    if (!url) return;

    const { queryParams } = Linking.parse(url);
    if (queryParams?.code) {
      supabase.auth
        .exchangeCodeForSession(queryParams.code as string)
        .then(() => router.replace('/(tabs)'));
    }
  }, []);

  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" />
    </View>
  );
}
