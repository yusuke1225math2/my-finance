import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CATEGORIES, type Category } from '@/types';

interface Props {
  value: Category | null;
  onChange: (c: Category) => void;
}

export default function CategoryPicker({ value, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
      <View className="flex-row gap-2">
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => onChange(cat)}
            className={`px-4 py-2 rounded-full border ${
              value === cat
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white border-gray-300'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                value === cat ? 'text-white' : 'text-gray-600'
              }`}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
