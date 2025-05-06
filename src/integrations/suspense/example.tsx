import React, { useEffect } from "react";
import { createSuspenseStore } from "./index";

interface DataState {
  data: Record<string, unknown>;
  loading: boolean;
  error: Error | null;
  fetchData: () => Promise<void>;
}

// 1. Create a store with Suspense support
const { useStore, withSuspense } = createSuspenseStore<DataState>(
  (set) => ({
    data: {},
    loading: false,
    error: null,
    fetchData: async () => {
      set((state) => ({ ...state, loading: true }));
      try {
        const response = await fetch("/api/data");
        const data = await response.json();
        set((state) => ({ ...state, data, loading: false }));
      } catch (error) {
        set((state) => ({ ...state, error: error as Error, loading: false }));
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
  const data = useStore((state: DataState) => state.data);
  const fetchData = useStore((state: DataState) => state.fetchData);

  useEffect(() => {
    fetchData();
  });

  return <div>{JSON.stringify(data)}</div>;
}

// 3. Wrap the component with Suspense
export const SuspenseDataComponent = withSuspense(DataComponent);

// 4. Use the component
export function App() {
  return <SuspenseDataComponent />;
}
