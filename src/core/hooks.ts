import { useContext, useState, useEffect, useSyncExternalStore } from 'react';
import { StoreContext } from './context';
import { StoreApi } from './createStore';
type Listener = () => void;

export function useLucentStore<T extends object>(): StoreApi<T> {
  const store = useContext(StoreContext) as StoreApi<T> | null;
  if (!store) {
    throw new Error('useLucentStore must be used within a LucentProvider');
  }
  return store;
}

export function useLucentSelector<T extends object, R>(
  selector: (state: T) => R,
  equalityFn: (a: R, b: R) => boolean = (a, b) => a === b
): R {
  const store = useLucentStore<T>();
  const [selectedState, setSelectedState] = useState<R>(() => selector(store.getState()));

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const newSelectedState = selector(store.getState());
      if (!equalityFn(selectedState, newSelectedState)) {
        setSelectedState(newSelectedState);
      }
    });

    return () => unsubscribe();
  }, [store, selector, equalityFn, selectedState]);

  return selectedState;
}

export function useLucentDispatch<T extends object>() {
  const store = useLucentStore<T>();
  return (action: (state: T) => T | ((state: T) => T)) => {
    store.setState(action(store.getState()));
  };
}

export function useLucentState<T extends object>(): T {
  const store = useLucentStore<T>();
  const [state, setState] = useState<T>(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState(store.getState());
    });

    return () => unsubscribe();
  }, [store]);

  return state;
}

export function useStore<T extends object, U>(selector: (state: T) => U): U {
  const store = useContext(StoreContext) as StoreApi<T> | null;
  if (!store) {
    throw new Error('Store not found. Make sure to wrap your app with StoreProvider');
  }

  const getSnapshot = () => selector(store.getState());
  
  return useSyncExternalStore(
    (listener: Listener) => store.subscribe(listener),
    getSnapshot,
    getSnapshot
  );
} 
