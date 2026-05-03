import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchExpenses } from '@/lib/expenses';
import type { Expense } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  食費: 'bg-green-100 text-green-700',
  日用品: 'bg-blue-100 text-blue-700',
  交通費: 'bg-yellow-100 text-yellow-700',
  外食: 'bg-orange-100 text-orange-700',
  娯楽: 'bg-purple-100 text-purple-700',
  その他: 'bg-gray-100 text-gray-600',
};

function ExpenseRow({ item }: { item: Expense }) {
  const [bg, fg] = (CATEGORY_COLORS[item.category ?? 'その他'] ?? CATEGORY_COLORS['その他']).split(' ');

  return (
    <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
      <View className="w-20 shrink-0">
        <Text className="text-xs text-gray-500">{item.date.replace(/-/g, '/')}</Text>
      </View>
      <View className="flex-1 min-w-0 px-2">
        <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
          {item.store}
        </Text>
        {item.category ? (
          <View className={`self-start mt-0.5 px-2 py-0.5 rounded-full ${bg}`}>
            <Text className={`text-xs ${fg}`}>{item.category}</Text>
          </View>
        ) : null}
      </View>
      <Text className="text-sm font-bold text-gray-900 shrink-0">
        ¥{item.amount.toLocaleString()}
      </Text>
    </View>
  );
}

export default function HistoryScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (nextPage: number, replace = false) => {
      if (loading) return;
      setLoading(true);
      try {
        const rows = await fetchExpenses(nextPage);
        setExpenses((prev) => (replace ? rows : [...prev, ...rows]));
        setHasMore(rows.length === 20);
        setPage(nextPage);
      } catch {
        // silent: 次回操作時に再試行可能
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  useEffect(() => {
    load(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await load(0, true);
    setRefreshing(false);
  }

  function handleEndReached() {
    if (hasMore && !loading) load(page + 1);
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      {/* ヘッダー行 */}
      <View className="flex-row items-center px-4 py-2 bg-gray-50 border-b border-gray-200">
        <Text className="w-20 text-xs font-medium text-gray-400">日付</Text>
        <Text className="flex-1 text-xs font-medium text-gray-400 px-2">店名</Text>
        <Text className="text-xs font-medium text-gray-400">金額</Text>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ExpenseRow item={item} />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-400">まだ支出がありません</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading && expenses.length > 0 ? (
            <View className="py-4">
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          ) : null
        }
      />

      {loading && expenses.length === 0 && (
        <View className="absolute inset-0 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      )}
    </SafeAreaView>
  );
}
