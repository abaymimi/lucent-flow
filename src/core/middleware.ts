import { StoreApi } from './createStore';

export type Middleware<T> = (
  store: StoreApi<T>
) => (next: StoreApi<T>['setState']) => StoreApi<T>['setState'];

export function applyMiddleware<T extends object>(
  store: StoreApi<T>,
  middlewares: Middleware<T>[]
): StoreApi<T> {
  let setState = store.setState;

  const middlewareChain = middlewares.map((middleware) => middleware(store));

  setState = middlewareChain.reduce(
    (next, middleware) => middleware(next),
    setState
  );

  return {
    ...store,
    setState,
  };
}

// Type for Redux DevTools Extension
interface ReduxDevTools {
  connect(options: { name: string }): {
    init(state: unknown): void;
    send(action: string, state: unknown): void;
  };
}

// DevTools middleware
export function devtools<T extends object>(
  store: StoreApi<T>,
  options: { name?: string; enabled?: boolean } = {}
): StoreApi<T> {
  const { name = 'Store', enabled = true } = options;

  if (!enabled) {
    return store;
  }

  const devTools = (window as unknown as { __REDUX_DEVTOOLS_EXTENSION__?: ReduxDevTools })
    .__REDUX_DEVTOOLS_EXTENSION__?.connect({
    name,
  });

  if (!devTools) {
    console.warn('Redux DevTools not found');
    return store;
  }

  devTools.init(store.getState());

  const setState: StoreApi<T>['setState'] = (partial: T | ((state: T) => T)) => {
    const nextState = typeof partial === 'function' ? partial(store.getState()) : partial;
    store.setState(nextState);
    devTools.send('State Update', nextState);
  };

  return {
    ...store,
    setState,
  };
}

// Logger middleware
export function logger<T extends object>(
  store: StoreApi<T>
): StoreApi<T> {
  const setState: StoreApi<T>['setState'] = (partial: T | ((state: T) => T)) => {
    const prevState = store.getState();
    const nextState = typeof partial === 'function' ? partial(prevState) : partial;
    
    console.group('State Update');
    console.log('Previous State:', prevState);
    console.log('Action:', partial);
    console.log('Next State:', nextState);
    console.groupEnd();

    store.setState(nextState);
  };

  return {
    ...store,
    setState,
  };
}

// Undo/Redo middleware
export function undoRedo<T extends object>(
  store: StoreApi<T>,
  options: { maxHistory?: number } = {}
): StoreApi<T> {
  const { maxHistory = 100 } = options;
  const history: T[] = [store.getState()];
  let currentIndex = 0;

  const setState: StoreApi<T>['setState'] = (partial: T | ((state: T) => T)) => {
    const nextState = typeof partial === 'function' ? partial(store.getState()) : partial;
    
    // Add new state to history
    history.splice(currentIndex + 1);
    history.push(nextState);
    currentIndex = history.length - 1;

    // Trim history if it exceeds maxHistory
    if (history.length > maxHistory) {
      history.shift();
      currentIndex--;
    }

    store.setState(nextState);
  };

  // Create a new store with additional methods
  const enhancedStore = {
    ...store,
    setState,
  } as StoreApi<T> & {
    undo: () => void;
    redo: () => void;
  };

  enhancedStore.undo = () => {
    if (currentIndex > 0) {
      currentIndex--;
      store.setState(history[currentIndex]);
    }
  };

  enhancedStore.redo = () => {
    if (currentIndex < history.length - 1) {
      currentIndex++;
      store.setState(history[currentIndex]);
    }
  };

  return enhancedStore;
} 