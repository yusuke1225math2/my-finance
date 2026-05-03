import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface Props {
  value: string;
  onChange: (date: string) => void;
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function DateField({ value, onChange }: Props) {
  const [show, setShow] = useState(false);
  const date = new Date(value);

  function handleChange(_: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShow(false);
    if (selected) onChange(toLocalDateString(selected));
  }

  const displayValue = value.replace(/-/g, '/');

  if (Platform.OS === 'ios') {
    return (
      <View>
        <TouchableOpacity
          onPress={() => setShow(true)}
          className="border border-gray-300 rounded-xl px-4 py-3 bg-white"
        >
          <Text className="text-base text-gray-800">{displayValue}</Text>
        </TouchableOpacity>
        <Modal visible={show} transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/30">
            <View className="bg-white rounded-t-2xl px-4 pb-8 pt-2">
              <TouchableOpacity
                onPress={() => setShow(false)}
                className="items-end py-2"
              >
                <Text className="text-blue-600 text-base font-medium">完了</Text>
              </TouchableOpacity>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                locale="ja-JP"
                onChange={handleChange}
              />
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        onPress={() => setShow(true)}
        className="border border-gray-300 rounded-xl px-4 py-3 bg-white"
      >
        <Text className="text-base text-gray-800">{displayValue}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
    </View>
  );
}
