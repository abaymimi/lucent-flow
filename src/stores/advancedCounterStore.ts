import { createStore as create } from '../core/createStore';
// import { devtools } from '../middleware/devtools';

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
// const actions = {
//   increment: () => (state: CounterState) => ({
//     count: state.count + 1,
//     history: [...state.history, state.count + 1],
//   }),
//   decrement: () => (state: CounterState) => ({
//     count: state.count - 1,
//     history: [...state.history, state.count - 1],
//   }),
//   reset: () => () => ({
//     count: 0,
//     history: [0],
//   }),
// };

// Create store with immutable updates
const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  history: [0],
  increment: () => set((state) => ({
    ...state,
    count: state.count + 1,
    history: [...state.history, state.count + 1],
  })),
  decrement: () => set((state) => ({
    ...state,
    count: state.count - 1,
    history: [...state.history, state.count - 1],
  })),
  reset: () => set((state) => ({
    ...state,
    count: 0,
    history: [0],
  })),
}));

// Enhance store with selectors and actions
// const enhancedStore = withSelectors(
//   withActions(useCounterStore, actions),
//   selectors
// );

// Create a hook that uses the store with selectors
export const useEnhancedCounterStore = () => {
  const state = useCounterStore.getState();
  return {
    ...state,
    isEven: selectors.isEven(state),
    historyLength: selectors.historyLength(state),
    lastValue: selectors.lastValue(state),
  };
}; 