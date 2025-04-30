// src/middleware/persist.ts

import type { Middleware } from '../types/middleware';

type StorageEngine = {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
};

export const createPersistMiddleware = <T>(
  key: string,
  storage: StorageEngine
): Middleware<T> => {
  return (getState) => (next) => async (value) => {
    next(value);
    try {
      const state = getState();
      const serialized = JSON.stringify(state);
      await storage.setItem(key, serialized);
    } catch (err) {
      console.error('[PersistMiddleware] Save failed:', err);
    }
  };
};
