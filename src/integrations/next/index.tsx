import { create, StoreApi, StateCreator } from 'zustand';
import { createContext, useContext, useRef, useEffect, Suspense } from 'react';

// Types
interface HydrationState {
  _hasHydrated: boolean;
}

interface NextConfig<T> {
  persist?: boolean;
  storageKey?: string;
  ssr?: boolean;
  suspense?: boolean;
}

// Create a context for the store
const StoreContext = createContext<StoreApi<any> | null>(null);

// Create a provider component
export function StoreProvider<T extends object>({
  children,
  createStore,
  config = {},
}: {
  children: React.ReactNode;
  createStore: () => StoreApi<T>;
  config?: NextConfig<T>;
}) {
  const storeRef = useRef<StoreApi<T> | null>(null);

  if (!storeRef.current) {
    storeRef.current = createStore();
  }

  // Handle hydration
  useEffect(() => {
    if (config.persist) {
      const storedState = localStorage.getItem(config.storageKey || 'store');
      if (storedState) {
        storeRef.current?.setState(JSON.parse(storedState));
      }
    }
  }, []);

  // Handle persistence
  useEffect(() => {
    if (config.persist) {
      const unsubscribe = storeRef.current?.subscribe((state) => {
        localStorage.setItem(
          config.storageKey || 'store',
          JSON.stringify(state)
        );
      });
      return () => unsubscribe?.();
    }
  }, []);

  return (
    <StoreContext.Provider value={storeRef.current}>
      {config.suspense ? (
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
      ) : (
        children
      )}
    </StoreContext.Provider>
  );
}

// Custom hook to use the store
export function useStore<T extends object, U>(
  selector: (state: T) => U,
  equalityFn?: (a: U, b: U) => boolean
) {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('Store not found. Wrap your app with StoreProvider.');
  }
  return store(selector, equalityFn);
}

// Create a store with SSR support
export function createNextStore<T extends object>(
  createState: StateCreator<T, [], []>,
  config: NextConfig<T> = {}
) {
  const { ssr = true, persist = false } = config;

  // Create the store
  const useStore = create<T & HydrationState>((set, get, store) => ({
    ...createState(set, get, store),
    _hasHydrated: false,
  }));

  // Add SSR support
  if (ssr) {
    const originalGetState = useStore.getState;
    useStore.getState = () => {
      const state = originalGetState();
      if (typeof window === 'undefined') {
        return state;
      }
      return {
        ...state,
        _hasHydrated: true,
      };
    };
  }

  // Add persistence support
  if (persist) {
    const storedState = typeof window !== 'undefined'
      ? localStorage.getItem(config.storageKey || 'store')
      : null;

    if (storedState) {
      useStore.setState({
        ...JSON.parse(storedState),
        _hasHydrated: true,
      });
    }
  }

  return useStore;
}

// Example usage:
/*
// 1. Create a store
const useCounterStore = createNextStore(
  {
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  },
  {
    persist: true,
    storageKey: 'counter-store',
    ssr: true,
    suspense: true,
  }
);

// 2. Wrap your app with the provider
function App({ Component, pageProps }) {
  return (
    <StoreProvider createStore={useCounterStore}>
      <Component {...pageProps} />
    </StoreProvider>
  );
}

// 3. Use the store in your components
function Counter() {
  const count = useStore((state) => state.count);
  const increment = useStore((state) => state.increment);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
*/ 