// src/utils/webStorage.ts

export const webStorage = {
    getItem: (key: string) => localStorage.getItem(key),
    setItem: (key: string, value: string) => localStorage.setItem(key, value),
  };
  