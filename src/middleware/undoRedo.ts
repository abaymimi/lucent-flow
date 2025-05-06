import { StoreApi} from '../core/createStore';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

interface UndoRedoMethods {
  undo: () => void;
  redo: () => void;
}

export const undoRedo = <T extends object>(
  store: StoreApi<T>,
  options?: {
    maxHistory?: number;
    enabled?: boolean;
  }
) => {
  const { maxHistory = 50, enabled = true } = options || {};

  if (!enabled) {
    return (set: StoreApi<T>['setState']) => set;
  }

  // Initialize history state
  const history: HistoryState<T> = {
    past: [],
    present: store.getState(),
    future: [],
  };

  // Add undo/redo methods to store
  const undo = () => {
    if (history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, -1);

    history.past = newPast;
    history.future = [history.present, ...history.future];
    history.present = previous;

    store.setState(previous);
  };

  const redo = () => {
    if (history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    history.past = [...history.past, history.present];
    history.future = newFuture;
    history.present = next;

    store.setState(next);
  };

  // Add methods to store
  const storeWithUndoRedo = store as StoreApi<T> & UndoRedoMethods;
  storeWithUndoRedo.undo = undo;
  storeWithUndoRedo.redo = redo;

  return (set: StoreApi<T>['setState']) => {
    return (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => {
      const nextState = typeof partial === 'function' 
        ? (partial as (state: T) => T | Partial<T>)(store.getState())
        : partial;

      // Update history
      history.past = [...history.past, history.present].slice(-maxHistory);
      history.present = nextState as T;
      history.future = [];

      set(nextState as T);
    };
  };
}; 