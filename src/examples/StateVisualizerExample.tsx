import React from "react";
import { create } from "zustand";
import { StateVisualizerComponent } from "../components/StateVisualizer";
import "./StateVisualizerExample.css";

// Create a sample store
interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

export const StateVisualizerExample: React.FC = () => {
  const { count, increment, decrement } = useCounterStore();

  return (
    <div className="visualizer-example">
      <h2>State Visualizer Example</h2>

      <div className="counter-controls">
        <button onClick={decrement}>-</button>
        <span>{count}</span>
        <button onClick={increment}>+</button>
      </div>

      <div className="visualizer-container">
        <StateVisualizerComponent
          store={useCounterStore}
          config={{
            maxHistory: 50,
            trackMemory: true,
            trackPerformance: true,
          }}
        />
      </div>
    </div>
  );
};
