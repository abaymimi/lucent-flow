import React from "react";
import { Suspense } from "react";
import { createStore, StoreApi } from "../../core/createStore";

interface SuspenseConfig {
  fallback?: React.ReactNode;
  timeoutMs?: number;
}

interface SuspenseState {
  promise: Promise<unknown> | null;
  resolve: ((value: unknown) => void) | null;
}

// interface SuspenseStore<T> extends StoreApi<T> {
//   suspense: SuspenseState;
// }

// Create a store with Suspense support
export function createSuspenseStore<T extends object>(
  createState: (
    set: StoreApi<T & { suspense: SuspenseState }>["setState"],
    get: StoreApi<T & { suspense: SuspenseState }>["getState"]
  ) => T,
  config: SuspenseConfig = {}
) {
  type StoreState = T & { suspense: SuspenseState };

  const store = createStore<StoreState>((set, get) => ({
    ...createState(set, get),
    suspense: {
      promise: null,
      resolve: null,
    },
  }));

  function useStore<U>(selector: (state: T) => U): U {
    const state = store.getState();
    const suspense = state.suspense;

    if (suspense.promise) {
      throw suspense.promise;
    }

    return selector(state);
  }

  function setSuspensePromise(promise: Promise<unknown>): void {
    store.setState((state) => ({
      ...state,
      suspense: {
        promise,
        resolve: null,
      },
    }));

    promise.finally(() => {
      store.setState((state) => ({
        ...state,
        suspense: {
          promise: null,
          resolve: null,
        },
      }));
    });
  }

  return {
    useStore,
    store,
    setSuspensePromise,
    withSuspense: <P extends object>(
      Component: React.ComponentType<P>
    ): React.FC<P> => withSuspense(Component, config),
  };
}

export function withSuspense<P extends object>(
  Component: React.ComponentType<P>,
  config: SuspenseConfig = {}
): React.FC<P> {
  return function SuspenseComponent(props: P) {
    return (
      <Suspense fallback={config.fallback || <div>Loading...</div>}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Example usage:
/*
// 1. Create a store with Suspense support
const { useStore, withSuspense } = createSuspenseStore(
  (set) => ({
    data: null,
    loading: false,
    error: null,
    fetchData: async () => {
      set({ loading: true });
      try {
        const response = await fetch('/api/data');
        const data = await response.json();
        set({ data, loading: false });
      } catch (error) {
        set({ error, loading: false });
      }
    },
  }),
  {
    fallback: <div>Loading data...</div>,
    timeoutMs: 10000,
  }
);

// 2. Create a component that uses the store
function DataComponent() {
  const data = useStore((state) => state.data);
  const fetchData = useStore((state) => state.fetchData);

  useEffect(() => {
    fetchData();
  }, []);

  return <div>{JSON.stringify(data)}</div>;
}

// 3. Wrap the component with Suspense
const SuspenseDataComponent = withSuspense(DataComponent);

// 4. Use the component
function App() {
  return <SuspenseDataComponent />;
}
*/
