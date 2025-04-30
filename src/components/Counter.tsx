import React from "react";
import { counterStore } from "../stores/counterStore";

const Counter = () => {
  const { state, setState } = counterStore.useStore();
  const typedState = state as { count: number };

  
  return (
    <div
      style={{ padding: "1rem", border: "1px solid #ccc", borderRadius: "6px" }}
    >
      <h2>Lucent Counter Test</h2>
      <p>Current Count: {typedState.count}</p>
      <button onClick={() => setState({ count: typedState.count + 1 })}>
        Increment
      </button>
      <button onClick={() => setState({ count: typedState.count - 1 })}>
        Decrement
      </button>
    </div>
  );
};

export default Counter;
