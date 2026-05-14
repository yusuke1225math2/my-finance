import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addExpense } from '@/lib/expenses';
import DateField from '@/components/DateField';
import CategoryPicker from '@/components/CategoryPicker';
import type { Category } from '@/types';

function todayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const INITIAL_FORM = {
  date: todayString(),
  store: '',
  category: null as Category | null,
  amount: '',
};

export default function RegisterScreen() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.store.trim()) {
      Alert.alert('入力エラー', '店名を入力してください');
      return;
    }
    const amount = parseInt(form.amount.replace(/[^0-9]/g, ''), 10);
    if (!amount || amount <= 0) {
      Alert.alert('入力エラー', '正しい金額を入力してください');
      return;
    }

    try {
      setSaving(true);
      await addExpense({
        date: form.date,
        store: form.store.trim(),
        category: form.category,
        amount,
        memo: null,
      });
      setForm({ ...INITIAL_FORM, date: form.date });
      Alert.alert('登録完了', `${form.store} ¥${amount.toLocaleString()} を登録しました`);
    } catch {
      Alert.alert('エラー', '登録に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 py-6 gap-5"
          keyboardShouldPersistTaps="handled"
        >
          {/* 日付 */}
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-gray-600">日付</Text>
            <DateField value={form.date} onChange={(v) => update('date', v)} />
          </View>

          {/* 店名 */}
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-gray-600">店名</Text>
            <TextInput
              value={form.store}
              onChangeText={(v) => update('store', v)}
              placeholder="例: Amazon"
              placeholderTextColor="#9CA3AF"
              returnKeyType="next"
              className="border border-gray-300 rounded-xl px-4 py-3 bg-white text-base text-gray-800"
            />
          </View>

          {/* カテゴリ */}
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-gray-600">カテゴリ</Text>
            <CategoryPicker
              value={form.category}
              onChange={(v) => update('category', v)}
            />
          </View>

          {/* 金額 */}
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-gray-600">金額（円）</Text>
            <TextInput
              value={form.amount}
              onChangeText={(v) => update('amount', v.replace(/[^0-9]/g, ''))}
              placeholder="例: 1305"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              returnKeyType="done"
              className="border border-gray-300 rounded-xl px-4 py-3 bg-white text-base text-gray-800"
            />
            {form.amount ? (
              <Text className="text-xs text-gray-400 pl-1">
                ¥{parseInt(form.amount || '0', 10).toLocaleString()}
              </Text>
            ) : null}
          </View>

          {/* 登録ボタン */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            className="bg-blue-600 rounded-xl py-4 items-center mt-2 active:opacity-70"
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-base font-bold">登録する</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
