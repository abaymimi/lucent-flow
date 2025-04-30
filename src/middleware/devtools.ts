import { StoreApi } from 'zustand';

export const devtools = <T extends object>(
  store: StoreApi<T>,
  options?: {
    name?: string;
    enabled?: boolean;
  }
) => {
  const { name = 'Lucent Store', enabled = true } = options || {};

  if (!enabled) {
    return (set: StoreApi<T>['setState']) => set;
  }

  // Initialize Redux DevTools
  const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__?.connect({
    name,
    trace: true,
  });

  if (!devTools) {
    console.warn('Redux DevTools extension not found');
    return (set: StoreApi<T>['setState']) => set;
  }

  // Send initial state
  devTools.init(store.getState());

  return (set: StoreApi<T>['setState']) => {
    return (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean) => {
      const nextState = typeof partial === 'function' 
        ? (partial as (state: T) => T | Partial<T>)(store.getState())
        : partial;

      set(nextState, false);

      // Send state update to DevTools
      devTools.send(
        typeof partial === 'function' ? 'function' : 'action',
        nextState
      );
    };
  };
}; 