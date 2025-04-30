import { StateCreator, StoreApi, create } from 'zustand';

// Example state interface
interface State {
  items: Array<{
    id: string;
    price: number;
    updated?: boolean;
  }>;
}

// Type for selector function
type Selector<T, R> = (state: T) => R;

// Type for action creator
type ActionCreator<T, P = void> = (payload: P) => (state: T) => Partial<T>;

// Cache interface
interface Cache<T, R> {
  value: R;
  dependencies: T;
  timestamp: number;
}

// Memoization options
interface MemoOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
  equalityFn?: (a: any, b: any) => boolean;
}

// Default equality function
const defaultEqualityFn = (a: any, b: any) => a === b;

// Create a memoized selector
export const createMemoizedSelector = <T, R>(
  selector: Selector<T, R>,
  options: MemoOptions = {}
) => {
  const { maxSize = 100, ttl = 0, equalityFn = defaultEqualityFn } = options;
  let cache: Cache<T, R> | null = null;

  return (state: T): R => {
    // Check if cache exists and is valid
    if (cache) {
      const isExpired = ttl > 0 && Date.now() - cache.timestamp > ttl;
      const isEqual = equalityFn(cache.dependencies, state);

      if (!isExpired && isEqual) {
        return cache.value;
      }
    }

    // Compute new value
    const value = selector(state);
    
    // Update cache
    cache = {
      value,
      dependencies: state,
      timestamp: Date.now(),
    };

    return value;
  };
};

// Create a memoized action creator
export const createMemoizedAction = <T, P>(
  action: ActionCreator<T, P>,
  options: MemoOptions = {}
) => {
  const { maxSize = 100, ttl = 0, equalityFn = defaultEqualityFn } = options;
  const cache = new Map<string, Cache<T, Partial<T>>>();

  return (payload: P) => {
    const key = JSON.stringify(payload);
    const cached = cache.get(key);

    return (state: T): Partial<T> => {
      // Check if cache exists and is valid
      if (cached) {
        const isExpired = ttl > 0 && Date.now() - cached.timestamp > ttl;
        const isEqual = equalityFn(cached.dependencies, state);

        if (!isExpired && isEqual) {
          return cached.value;
        }
      }

      // Compute new value
      const value = action(payload)(state);
      
      // Update cache
      cache.set(key, {
        value,
        dependencies: state,
        timestamp: Date.now(),
      });

      // Clean up old entries if maxSize is reached
      if (cache.size > maxSize) {
        const oldestKey = Array.from(cache.keys())[0];
        cache.delete(oldestKey);
      }

      return value;
    };
  };
};

// Example usage:

// 1. Memoized Selector
const expensiveSelector = createMemoizedSelector(
  (state: State) => state.items.filter((item: { price: number }) => item.price > 100),
  {
    ttl: 1000, // Cache for 1 second
    maxSize: 50, // Keep last 50 results
    equalityFn: (a, b) => a.items === b.items, // Custom equality check
  }
);

// 2. Memoized Action
const updateItem = createMemoizedAction(
  (id: string) => (state: State) => ({
    items: state.items.map((item: State['items'][0]) =>
      item.id === id ? { ...item, updated: true } : item
    ),
  }),
  {
    ttl: 5000, // Cache for 5 seconds
    maxSize: 100, // Keep last 100 results
  }
);

// 3. Using in a store
const useStore = create<State>()((set: (fn: (state: State) => Partial<State>) => void) => ({
  items: [],
  // Memoized selector
  getExpensiveItems: () => expensiveSelector(useStore.getState()),
  // Memoized action
  updateItem: (id: string) => set(updateItem(id)),
})); 