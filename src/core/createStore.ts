import { useState, useEffect, useCallback } from 'react';
import { Middleware } from '../types/middleware';

export type Store<T> = {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  getState: () => T;
};

export const createStore = <T>(
  initialState: T,
  middlewares: Middleware<T>[] = []
) => {
  let currentState = initialState;
  const subscribers = new Set<(state: T) => void>();

  const getState = () => currentState;

  const rawSetState = (newState: T | ((prev: T) => T)) => {
    const nextState = typeof newState === 'function' ? (newState as (prev: T) => T)(currentState) : newState;
    currentState = nextState;
    subscribers.forEach((callback) => callback(currentState));
  };

  const setStateWithMiddleware = (value: T | ((prev: T) => T)) => {
    const apply = (val: T | ((prev: T) => T)) => rawSetState(val);

    const composed = middlewares.reduceRight(
      (next, mw) => mw(getState, setStateWithMiddleware)(next),
      apply
    );

    composed(value);
  };

  const useStore = () => {
    const [state, set] = useState<T>(currentState);

    useEffect(() => {
      const listener = (newState: T) => set(newState);
      subscribers.add(listener);
      return () => {
        subscribers.delete(listener);
      };
    }, []);

    const setStateWrapper = useCallback((value: T | ((prev: T) => T)) => {
      setStateWithMiddleware(value);
    }, []);

    return { state, setState: setStateWrapper, getState };
  };

  return {
    useStore,
    getState,
    setState: setStateWithMiddleware,
  };
};
