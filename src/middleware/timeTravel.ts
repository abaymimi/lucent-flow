import { StoreApi } from "../core/createStore";

interface TimeTravelState<T> {
  past: T[];
  present: T;
  future: T[];
  currentIndex: number;
  actions: string[];
}

interface TimeTravelMethods<T> {
  undo: () => void;
  redo: () => void;
  jumpTo: (index: number) => void;
  getHistory: () => TimeTravelState<T>;
  clearHistory: () => void;
}

// interface TimeTravelConfig {
//   maxHistory?: number;
//   enableDevTools?: boolean;
//   recordActions?: boolean;
// }

// interface ReduxDevTools {
//   connect: (options: { name: string; trace?: boolean }) => {
//     init: (state: unknown) => void;
//     send: (action: string, state: unknown) => void;
//   };
// }

export const timeTravel = <T extends object>(
  store: StoreApi<T>,
  config: { maxHistory?: number; recordActions?: boolean } = {}
) => {
  const { maxHistory = 50, recordActions = false } = config;

  const timeTravelState: TimeTravelState<T> = {
    past: [],
    present: store.getState(),
    future: [],
    currentIndex: 0,
    actions: [],
  };

  const timeTravelMethods: TimeTravelMethods<T> = {
    undo: () => {
      if (timeTravelState.currentIndex > 0) {
        timeTravelState.currentIndex--;
        const previousState = timeTravelState.past[timeTravelState.currentIndex];
        store.setState(previousState);
        timeTravelState.present = previousState;
        timeTravelState.future = [timeTravelState.present, ...timeTravelState.future];
      }
    },
    redo: () => {
      if (timeTravelState.future.length > 0) {
        const nextState = timeTravelState.future[0];
        timeTravelState.future = timeTravelState.future.slice(1);
        timeTravelState.currentIndex++;
        store.setState(nextState);
        timeTravelState.present = nextState;
      }
    },
    jumpTo: (index: number) => {
      if (index >= 0 && index < timeTravelState.past.length) {
        const targetState = timeTravelState.past[index];
        timeTravelState.currentIndex = index;
        store.setState(targetState);
        timeTravelState.present = targetState;
        timeTravelState.future = timeTravelState.past.slice(index + 1);
      }
    },
    getHistory: () => ({ ...timeTravelState }),
    clearHistory: () => {
      timeTravelState.past = [];
      timeTravelState.future = [];
      timeTravelState.currentIndex = 0;
      timeTravelState.actions = [];
    },
  };

  // Add time travel methods to store
  (store as StoreApi<T> & { timeTravel: TimeTravelMethods<T> }).timeTravel = timeTravelMethods;

  return (set: StoreApi<T>['setState']) => {
    return (partial: T | ((state: T) => T), action?: string) => {
      const nextState = typeof partial === 'function' 
        ? (partial as (state: T) => T)(store.getState())
        : partial;

      // Only update history if state actually changed
      if (JSON.stringify(timeTravelState.present) !== JSON.stringify(nextState)) {
        // Update time-travel state
        timeTravelState.past = [...timeTravelState.past, timeTravelState.present].slice(-maxHistory);
        timeTravelState.present = nextState;
        timeTravelState.future = [];
        timeTravelState.currentIndex = timeTravelState.past.length;

        if (recordActions && action) {
          timeTravelState.actions = [...timeTravelState.actions, action].slice(-maxHistory);
        }

        // Update store state
        set(nextState);
      }
    };
  };
}; 