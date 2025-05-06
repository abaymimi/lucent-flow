import { StoreApi, createStore } from '../core/createStore';

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
interface MemoOptions<T> {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
  equalityFn?: EqualityFn<T>;
}

// Type for memoized selector function
export type MemoizedSelector<T, R> = (state: T) => R;

// Type for equality function
export type EqualityFn<T> = (a: T, b: T) => boolean;

// Default equality function
const defaultEqualityFn = <T>(a: T, b: T): boolean => a === b;

// Create a memoized selector
export const createMemoizedSelector = <T extends object, R>(
  selector: Selector<T, R>,
  equalityFn: EqualityFn<R> = defaultEqualityFn,
  options: MemoOptions<R> = {}
): MemoizedSelector<T, R> => {
  const {  ttl = 0 } = options;
  let lastResult: R | undefined;
  let lastState: T | undefined;
  let lastTimestamp = Date.now();

  return (state: T) => {
    const currentTime = Date.now();
    if (lastState === state && (!ttl || currentTime - lastTimestamp <= ttl)) {
      return lastResult as R;
    }

    const result = selector(state);
    if (lastResult === undefined || !equalityFn(lastResult, result)) {
      lastResult = result;
      lastState = state;
      lastTimestamp = currentTime;
    }

    return lastResult;
  };
};

// Create a memoized action creator
export const createMemoizedAction = <T, P>(
  action: ActionCreator<T, P>,
  options: MemoOptions<T> = {}
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

// Create a memoized store
export const createMemoizedStore = <T extends object, S extends Record<string, MemoizedSelector<T, unknown>>>(
  store: StoreApi<T>,
  config?: {
    selectors: S;
    equalityFns: { [K in keyof S]: EqualityFn<ReturnType<S[K]>> };
  }
): StoreApi<T & { [K in keyof S]: ReturnType<S[K]> }> => {
  const { selectors = {} as S, equalityFns = {} as { [K in keyof S]: EqualityFn<ReturnType<S[K]>> } } = config || {};

  const memoizedStore = {
    ...store,
    getState: () => {
      const state = store.getState();
      return new Proxy(state as T & { [K in keyof S]: ReturnType<S[K]> }, {
        get: (target, prop) => {
          if (typeof prop === 'string' && prop in selectors) {
            const selector = selectors[prop as keyof S];
            const equalityFn = equalityFns[prop as keyof S] || defaultEqualityFn;
            const result = selector(state) as ReturnType<S[keyof S]>;
            return createMemoizedSelector(() => result, equalityFn)(state);
          }
          return target[prop as keyof T];
        },
      });
    },
  };

  return memoizedStore as StoreApi<T & { [K in keyof S]: ReturnType<S[K]> }>;
};

// Create a memoized selector factory
export const createSelectorFactory = <T extends object>() => {
  return <R>(selector: (state: T) => R, equalityFn?: EqualityFn<R>) => {
    return createMemoizedSelector(selector, equalityFn);
  };
};

// Create a memoized store factory
export const createStoreFactory = <T extends object>() => {
  return <S extends Record<string, MemoizedSelector<T, unknown>>>(
    store: StoreApi<T>,
    config?: {
      selectors: S;
      equalityFns: { [K in keyof S]: EqualityFn<ReturnType<S[K]>> };
    }
  ) => {
    return createMemoizedStore(store, config);
  };
};

// Example usage:

// 1. Memoized Selector
const expensiveSelector = createMemoizedSelector<State, Array<State['items'][0]>>(
  (state: State) => state.items.filter((item) => item.price > 100),
  (a: Array<State['items'][0]>, b: Array<State['items'][0]>) => 
    a.length === b.length && a.every((item, index) => item.id === b[index].id),
  { ttl: 1000, maxSize: 50 }
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
const useStore = createStore<State>((set) => ({
  items: [],
  // Memoized selector
  getExpensiveItems: () => expensiveSelector(useStore.getState()),
  // Memoized action
  updateItem: (id: string) => set((state) => {
    const update = updateItem(id)(state);
    return { ...state, items: update.items || state.items };
  }),
}));

// interface Product {
//   id: string;
//   price: number;
//   updated?: boolean;
// }

// interface ProductState {
//   products: Product[];
//   loading: boolean;
//   error: string | null;
// }

// Create a store
// const useProductStore = create<ProductState>(() => ({
//   products: [],
//   loading: false,
//   error: null,
// }));

// Create memoized selectors
// const getTotalPrice = (state: ProductState) =>
//   state.products.reduce((sum, product) => sum + product.price, 0);

// const getUpdatedProducts = (state: ProductState) =>
//   state.products.filter((product) => product.updated);

// Create a memoized store with selectors
// const memoizedStore = createMemoizedStore(useProductStore, {
//   selectors: {
//     totalPrice: getTotalPrice,
//     updatedProducts: getUpdatedProducts,
//   },
//   equalityFns: {
//     totalPrice: (a: number, b: number) => a === b,
//     updatedProducts: (a: Product[], b: Product[]) =>
//       a.length === b.length && a.every((product, index) => product.id === b[index].id),
//   },
// });

// Use the memoized store
// const totalPrice = memoizedStore.getState().totalPrice;
// const updatedProducts = memoizedStore.getState().updatedProducts; 