import React from "react";
import { create, StoreApi, StateCreator, UseBoundStore } from "zustand";
import { Suspense, useTransition } from "react";

interface SuspenseConfig<T> {
  fallback?: React.ReactNode;
  timeoutMs?: number;
}

interface SuspenseStore<T> {
  useStore: UseBoundStore<StoreApi<T>>;
  withSuspense: <P extends object>(
    Component: React.ComponentType<P>
  ) => React.ComponentType<P>;
}

// Create a store with Suspense support
export function createSuspenseStore<T extends object>(
  createState: StateCreator<T, [], []>,
  config: SuspenseConfig<T> = {}
): SuspenseStore<T> {
  const { fallback = <div>Loading...</div>, timeoutMs = 5000 } = config;

  // Create the store
  const useStore = create<T>(createState);

  // Create a Suspense wrapper component
  const withSuspense = <P extends object>(
    Component: React.ComponentType<P>
  ): React.ComponentType<P> => {
    return function SuspenseWrapper(props: P) {
      const [isPending, startTransition] = useTransition();

      return (
        <Suspense fallback={fallback}>
          <Component {...props} />
        </Suspense>
      );
    };
  };

  return {
    useStore,
    withSuspense,
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
