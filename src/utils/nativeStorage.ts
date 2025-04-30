// src/utils/nativeStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const nativeStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
};
