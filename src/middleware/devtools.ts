import { StoreApi } from 'zustand';

interface ReduxDevTools {
  connect: (options: { name: string; trace: boolean }) => {
    init: (state: unknown) => void;
    send: (action: string, state: unknown) => void;
  };
}

declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: ReduxDevTools;
  }
}

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
  const devTools = window.__REDUX_DEVTOOLS_EXTENSION__?.connect({
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
    return (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => {
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