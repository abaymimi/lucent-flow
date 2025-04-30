import { StateCreator, StoreApi } from 'zustand';

export const logger = <T extends object>(
  config?: { enabled?: boolean; logState?: boolean; logActions?: boolean }
) => {
  const { enabled = true, logState = true, logActions = true } = config || {};
  
  return (fn: StateCreator<T, [], []>) => (
    set: StoreApi<T>['setState'],
    get: StoreApi<T>['getState'],
    store: StoreApi<T>
  ) => {
    if (!enabled) return fn(set, get, store);

    const newSet = (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean) => {
      if (logActions) {
        console.group('State Update');
        console.log('Action:', typeof partial === 'function' ? 'function' : 'object');
        if (logState) {
          console.log('Previous State:', get());
          console.log('Next State:', typeof partial === 'function' ? partial(get()) : partial);
        }
        console.groupEnd();
      }
      return set(partial, false);
    };

    return fn(newSet, get, store);
  };
};
