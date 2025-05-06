import React from "react";
import {
  createContext,
  useContext,
  useRef,
  useSyncExternalStore,
  ReactNode,
  FC,
} from "react";

type Listener = () => void;
type SetState<T> = (partial: T | ((state: T) => T)) => void;
type GetState<T> = () => T;
type Subscribe = (listener: Listener) => () => void;

export interface StoreApi<T> {
  setState: SetState<T>;
  getState: GetState<T>;
  subscribe: Subscribe;
}

export interface StoreProviderProps {
  children: ReactNode;
}

export function createStore<T extends object>(
  createState: (set: SetState<T>, get: GetState<T>) => T
): StoreApi<T> {
  let state: T | null = null;
  const listeners = new Set<Listener>();

  const setState: SetState<T> = (partial) => {
    if (!state) return;
    const nextState =
      typeof partial === "function"
        ? (partial as (state: T) => T)(state)
        : partial;
    if (nextState !== state) {
      state = nextState;
      listeners.forEach((listener) => listener());
    }
  };

  const getState: GetState<T> = () => {
    if (!state) throw new Error("State not initialized");
    return state;
  };

  const subscribe: Subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  state = createState(setState, getState);

  return {
    setState,
    getState,
    subscribe,
  };
}

export function createContextStore<T extends object>(
  createState: (set: SetState<T>, get: GetState<T>) => T
) {
  const StoreContext = createContext<StoreApi<T> | null>(null);

  const StoreProvider: FC<StoreProviderProps> = ({ children }) => {
    const storeRef = useRef<StoreApi<T> | null>(null);
    if (!storeRef.current) {
      storeRef.current = createStore(createState);
    }

    return (
      <StoreContext.Provider value={storeRef.current}>
        {children}
      </StoreContext.Provider>
    );
  };

  const useStore = <U,>(selector: (state: T) => U): U => {
    const store = useContext(StoreContext);
    if (!store) {
      throw new Error(
        "Store not found. Make sure to wrap your app with StoreProvider"
      );
    }

    const getSnapshot = () => selector(store.getState());

    return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
  };

  return {
    StoreProvider,
    useStore,
    StoreContext,
  };
}
