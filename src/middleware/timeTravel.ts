import { StoreApi } from 'zustand';

interface TimeTravelState<T> {
  past: T[];
  present: T;
  future: T[];
  currentIndex: number;
  actions: string[];
}

interface TimeTravelConfig {
  maxHistory?: number;
  enableDevTools?: boolean;
  recordActions?: boolean;
}

export const timeTravel = <T extends object>(
  store: StoreApi<T>,
  config: TimeTravelConfig = {}
) => {
  const { maxHistory = 50, enableDevTools = true, recordActions = true } = config;

  // Initialize time-travel state
  const timeTravelState: TimeTravelState<T> = {
    past: [],
    present: store.getState(),
    future: [],
    currentIndex: 0,
    actions: [],
  };

  // Initialize Redux DevTools if enabled
  const devTools = enableDevTools
    ? (window as any).__REDUX_DEVTOOLS_EXTENSION__?.connect({
        name: 'Lucent-Flow Time Travel',
      })
    : null;

  if (devTools) {
    devTools.init(timeTravelState.present);
  }

  // Time-travel methods
  const back = () => {
    if (timeTravelState.past.length === 0) return;

    const previous = timeTravelState.past[timeTravelState.past.length - 1];
    const newPast = timeTravelState.past.slice(0, -1);

    timeTravelState.past = newPast;
    timeTravelState.future = [timeTravelState.present, ...timeTravelState.future];
    timeTravelState.present = previous;
    timeTravelState.currentIndex--;

    store.setState(previous);
    if (devTools) {
      devTools.send('BACK', timeTravelState.present);
    }
  };

  const forward = () => {
    if (timeTravelState.future.length === 0) return;

    const next = timeTravelState.future[0];
    const newFuture = timeTravelState.future.slice(1);

    timeTravelState.past = [...timeTravelState.past, timeTravelState.present];
    timeTravelState.future = newFuture;
    timeTravelState.present = next;
    timeTravelState.currentIndex++;

    store.setState(next);
    if (devTools) {
      devTools.send('FORWARD', timeTravelState.present);
    }
  };

  const jumpTo = (index: number) => {
    if (index < 0 || index >= timeTravelState.past.length + timeTravelState.future.length + 1) {
      return;
    }

    const targetIndex = index;
    const currentIndex = timeTravelState.currentIndex;

    if (targetIndex === currentIndex) return;

    if (targetIndex < currentIndex) {
      // Move backward
      const steps = currentIndex - targetIndex;
      for (let i = 0; i < steps; i++) {
        back();
      }
    } else {
      // Move forward
      const steps = targetIndex - currentIndex;
      for (let i = 0; i < steps; i++) {
        forward();
      }
    }
  };

  const replayFrom = (index: number) => {
    if (index < 0 || index >= timeTravelState.actions.length) return;

    const currentState = timeTravelState.present;
    const actionsToReplay = timeTravelState.actions.slice(index);

    // Reset to the state at the given index
    jumpTo(index);

    // Replay actions
    actionsToReplay.forEach((action) => {
      // Execute the action
      // This would need to be implemented based on your action format
      console.log('Replaying action:', action);
    });
  };

  const clearHistory = () => {
    timeTravelState.past = [];
    timeTravelState.future = [];
    timeTravelState.actions = [];
    timeTravelState.currentIndex = 0;
  };

  // Add time-travel methods to store
  (store as any).timeTravel = {
    back,
    forward,
    jumpTo,
    replayFrom,
    clearHistory,
    getCurrentIndex: () => timeTravelState.currentIndex,
    getHistory: () => ({
      past: timeTravelState.past,
      present: timeTravelState.present,
      future: timeTravelState.future,
      actions: timeTravelState.actions,
    }),
  };

  return (set: StoreApi<T>['setState']) => {
    return (partial: T | Partial<T> | ((state: T) => T | Partial<T>), action?: string) => {
      const nextState = typeof partial === 'function' 
        ? (partial as (state: T) => T | Partial<T>)(store.getState())
        : partial;

      // Update time-travel state
      timeTravelState.past = [...timeTravelState.past, timeTravelState.present].slice(-maxHistory);
      timeTravelState.present = nextState as T;
      timeTravelState.future = [];
      timeTravelState.currentIndex = timeTravelState.past.length;

      if (recordActions && action) {
        timeTravelState.actions = [...timeTravelState.actions, action].slice(-maxHistory);
      }

      // Update store state
      set(nextState, false);

      // Send to DevTools
      if (devTools) {
        devTools.send(action || 'STATE_UPDATE', timeTravelState.present);
      }
    };
  };
}; 