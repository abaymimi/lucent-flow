import React from "react";
import { createNextStore, StoreProvider, useStore } from "./index";
import { StateCreator } from "zustand";

interface CounterState {
  count: number;
  increment: () => void;
}

// 1. Create a store
const useCounterStore = createNextStore<CounterState>(
  (set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }),
  {
    persist: true,
    storageKey: "counter-store",
    ssr: true,
    suspense: true,
  }
);

// 2. Wrap your app with the provider
export function App({
  Component,
  pageProps,
}: {
  Component: React.ComponentType;
  pageProps: any;
}) {
  return (
    <StoreProvider createStore={() => useCounterStore}>
      <Component {...pageProps} />
    </StoreProvider>
  );
}

// 3. Use the store in your components
export function Counter() {
  const count = useStore<CounterState, number>((state) => state.count);
  const increment = useStore<CounterState, () => void>(
    (state) => state.increment
  );

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
