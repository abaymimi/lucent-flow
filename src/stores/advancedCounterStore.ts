import { create } from 'zustand';
import { withSelectors, withActions, immer } from '../utils/stateUtils';

interface CounterState {
  count: number;
  history: number[];
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

// Selectors
const selectors = {
  isEven: (state: CounterState) => state.count % 2 === 0,
  historyLength: (state: CounterState) => state.history.length,
  lastValue: (state: CounterState) => state.history[state.history.length - 1],
};

// Action creators
const actions = {
  increment: () => (state: CounterState) => ({
    count: state.count + 1,
    history: [...state.history, state.count + 1],
  }),
  decrement: () => (state: CounterState) => ({
    count: state.count - 1,
    history: [...state.history, state.count - 1],
  }),
  reset: () => () => ({
    count: 0,
    history: [0],
  }),
};

// Create store with immer for immutable updates
const useCounterStore = create<CounterState>()(
  immer((set) => ({
    count: 0,
    history: [0],
    increment: () => set((state) => ({
      count: state.count + 1,
      history: [...state.history, state.count + 1],
    })),
    decrement: () => set((state) => ({
      count: state.count - 1,
      history: [...state.history, state.count - 1],
    })),
    reset: () => set((state) => ({
      count: 0,
      history: [0],
    })),
  }))
);

// Enhance store with selectors and actions
const enhancedStore = withSelectors(
  withActions(useCounterStore, actions),
  selectors
);

// Create a hook that uses the enhanced store
export const useEnhancedCounterStore = () => {
  const state = useCounterStore();
  const enhancedState = {
    ...state,
    isEven: selectors.isEven(state),
    historyLength: selectors.historyLength(state),
    lastValue: selectors.lastValue(state),
  };
  return enhancedState;
}; 