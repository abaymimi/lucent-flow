import { StoreApi } from '../core/createStore';

export const logger = <T extends object>(
  config?: { enabled?: boolean; logState?: boolean; logActions?: boolean }
) => {
  const { enabled = true, logState = true, logActions = true } = config || {};
  
  return (fn: (set: StoreApi<T>['setState'], get: StoreApi<T>['getState']) => T) => (
    set: StoreApi<T>['setState'],
    get: StoreApi<T>['getState'],
    // store: StoreApi<T>
  ) => {
    if (!enabled) return fn(set, get);

    const newSet = (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => {
      if (logActions) {
        console.group('State Update');
        console.log('Action:', typeof partial === 'function' ? 'function' : 'object');
        if (logState) {
          console.log('Previous State:', get());
          console.log('Next State:', typeof partial === 'function' ? partial(get()) : partial);
        }
        console.groupEnd();
      }
      const nextState = typeof partial === 'function' 
        ? (partial as (state: T) => T)(get())
        : { ...get(), ...partial };
      return set(nextState);
    };

    return fn(newSet, get);
  };
};
