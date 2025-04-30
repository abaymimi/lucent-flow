export type Middleware<T> = (
    getState: () => T,
    setState: (value: T | ((prev: T) => T)) => void
  ) => (
    next: (value: T | ((prev: T) => T)) => void
  ) => (
    value: T | ((prev: T) => T)
  ) => void;
  