import React from "react";
import { useEnhancedCounterStore } from "../stores/advancedCounterStore";

export const AdvancedCounter: React.FC = () => {
  const {
    count,
    increment,
    decrement,
    reset,
    isEven,
    historyLength,
    lastValue,
  } = useEnhancedCounterStore();

  return (
    <div className="advanced-counter">
      <h2>Advanced Counter</h2>

      <div className="counter-display">
        <p>Count: {count}</p>
        <p>Is Even: {isEven ? "Yes" : "No"}</p>
        <p>History Length: {historyLength}</p>
        <p>Last Value: {lastValue}</p>
      </div>

      <div className="counter-controls">
        <button onClick={increment}>Increment</button>
        <button onClick={decrement}>Decrement</button>
        <button onClick={reset}>Reset</button>
      </div>
    </div>
  );
};
