import React, { useContext } from "react";
import { useStore, StoreContext } from "../stores/counterStore";
import { StoreApi } from "../core/createStore";

interface CounterState {
  count: number;
}

const Counter = () => {
  const count = useStore((state: CounterState) => state.count);
  const store = useContext(StoreContext) as StoreApi<CounterState>;

  const increment = () => {
    store.setState((state: CounterState) => ({
      ...state,
      count: state.count + 1,
    }));
  };

  const decrement = () => {
    store.setState((state: CounterState) => ({
      ...state,
      count: state.count - 1,
    }));
  };

  return (
    <div
      style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "6px" }}
    >
      <h2>Lucent Counter Test</h2>
      <div>Current Count: {count}</div>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
    </div>
  );
};

export default Counter;
