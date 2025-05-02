import { StoreApi } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Type for selector function
export type Selector<T, R> = (state: T) => R;

// Type for action creator
export type ActionCreator<T, P = void> = (payload: P) => (state: T) => Partial<T>;

// Create a selector middleware
export const withSelectors = <T extends object, S extends Record<string, Selector<T, unknown>>>(
  store: StoreApi<T>,
  selectors: S
) => {
  const useStore = store;
  
  Object.entries(selectors).forEach(([key, selector]) => {
    const typedStore = useStore as StoreApi<T & { [K in keyof S]: () => ReturnType<S[K]> }>;
    (typedStore as unknown as Record<string, () => ReturnType<S[keyof S]>>)[key] = () => {
      const state = useStore.getState();
      return selector(state) as ReturnType<S[keyof S]>;
    };
  });

  return useStore as StoreApi<T & { [K in keyof S]: () => ReturnType<S[K]> }>;
};

// Create an action creator middleware
export const withActions = <T extends object, A extends Record<string, ActionCreator<T, unknown>>>(
  store: StoreApi<T>,
  actions: A
) => {
  const useStore = store;
  
  Object.entries(actions).forEach(([key, action]) => {
    const typedStore = useStore as StoreApi<T & { [K in keyof A]: (payload: Parameters<A[K]>[0]) => void }>;
    (typedStore as unknown as Record<string, (payload: Parameters<A[keyof A]>[0]) => void>)[key] = (payload: Parameters<A[keyof A]>[0]) => {
      const state = useStore.getState();
      const update = action(payload)(state);
      useStore.setState(update);
    };
  });

  return useStore as StoreApi<T & { [K in keyof A]: (payload: Parameters<A[K]>[0]) => void }>;
};

// Combine multiple stores
export const combineStores = <T extends object, U extends object>(
  store1: StoreApi<T>,
  store2: StoreApi<U>
): StoreApi<T & U> => {
  const combinedStore = {
    getState: () => ({
      ...store1.getState(),
      ...store2.getState(),
    }),
    setState: (partial: Partial<T & U>) => {
      const state1 = store1.getState();
      const state2 = store2.getState();
      store1.setState({ ...state1, ...partial });
      store2.setState({ ...state2, ...partial });
    },
    subscribe: (listener: (state: T & U, prevState: T & U) => void) => {
      const unsub1 = store1.subscribe((state) => {
        listener({ ...state, ...store2.getState() } as T & U, combinedStore.getState());
      });
      const unsub2 = store2.subscribe((state) => {
        listener({ ...store1.getState(), ...state } as T & U, combinedStore.getState());
      });
      return () => {
        unsub1();
        unsub2();
      };
    },
  } as StoreApi<T & U>;

  return combinedStore;
};

// Split store into smaller pieces
export const splitStore = <T extends object, K extends keyof T>(
  store: StoreApi<T>,
  keys: K[]
): Record<K, StoreApi<Pick<T, K>>> => {
  return keys.reduce((acc, key) => {
    acc[key] = {
      getState: () => ({ [key]: store.getState()[key] } as Pick<T, K>),
      setState: (partial: Partial<Pick<T, K>>) => {
        const currentState = store.getState();
        store.setState({ ...currentState, [key]: partial[key] });
      },
      subscribe: (listener) => store.subscribe(listener),
    } as StoreApi<Pick<T, K>>;
    return acc;
  }, {} as Record<K, StoreApi<Pick<T, K>>>);
};

// Remove the custom immer implementation and export Zustand's immer
export { immer }; 