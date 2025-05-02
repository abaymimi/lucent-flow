import React from "react";
import { StoreProvider } from "./index";
import { useStore } from "./hooks";
import { createNextStore } from "./store";

interface CounterState {
  count: number;
  increment: () => void;
}

// 1. Create a store
const useCounterStore = createNextStore<CounterState>(
  (set: (fn: (state: CounterState) => Partial<CounterState>) => void) => ({
    count: 0,
    increment: () => set((state: CounterState) => ({ count: state.count + 1 })),
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
  pageProps: Record<string, unknown>;
}) {
  return (
    <StoreProvider createStore={() => useCounterStore}>
      <Component {...pageProps} />
    </StoreProvider>
  );
}

// 3. Use the store in your components
export function Counter() {
  const count = useStore<CounterState, number>(
    (state: CounterState) => state.count
  );
  const increment = useStore<CounterState, () => void>(
    (state: CounterState) => state.increment
  );

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
