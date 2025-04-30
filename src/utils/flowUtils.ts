import { StateCreator, StoreApi, create } from 'zustand';

// Type definitions
type EqualityFn<T> = (a: T, b: T) => boolean;
type Selector<T, R> = (state: T) => R;
type Action<T, P = void> = (payload: P) => (state: T) => Partial<T>;
type Middleware<T> = (set: StoreApi<T>['setState'], get: StoreApi<T>['getState'], store: StoreApi<T>) => StoreApi<T>['setState'];

// Example state interface
interface State {
  items: Array<{
    id: string;
    price: number;
    updated?: boolean;
  }>;
  filters: {
    minPrice: number;
    category: string;
  };
  query: string;
}

// 1. Custom Memoization
interface MemoOptions {
  maxSize?: number;
  ttl?: number;
  equalityFn?: EqualityFn<any>;
}

export const lucentMemo = <T, R>(
  fn: (arg: T) => R,
  options: MemoOptions = {}
) => {
  const { maxSize = 100, ttl = 0, equalityFn = (a, b) => a === b } = options;
  let cache: { value: R; arg: T; timestamp: number } | null = null;

  return (arg: T): R => {
    if (cache) {
      const isExpired = ttl > 0 && Date.now() - cache.timestamp > ttl;
      const isEqual = equalityFn(cache.arg, arg);

      if (!isExpired && isEqual) {
        return cache.value;
      }
    }

    const value = fn(arg);
    cache = { value, arg, timestamp: Date.now() };
    return value;
  };
};

// 2. Custom Selector Creator
export const lucentSelector = <T, R>(
  selectors: Selector<T, any>[],
  combiner: (...args: any[]) => R
) => {
  const memoizedSelectors = selectors.map(selector => lucentMemo(selector));
  
  return (state: T): R => {
    const selectedValues = memoizedSelectors.map(selector => selector(state));
    return combiner(...selectedValues);
  };
};

// 3. Custom Batch Updates
export const lucentBatch = <T extends object>(): Middleware<T> => {
  return (set, get, store) => {
    let batchQueue: (() => Partial<T>)[] = [];
    let isBatching = false;

    const processBatch = () => {
      if (batchQueue.length === 0) return;
      
      const currentState = get();
      let newState = { ...currentState } as T;

      batchQueue.forEach(update => {
        const partial = update();
        newState = { ...newState, ...partial } as T;
      });

      set(newState);
      batchQueue = [];
      isBatching = false;
    };

    return (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => {
      if (typeof partial === 'function') {
        batchQueue.push(() => (partial as (state: T) => T | Partial<T>)(get()));
      } else {
        batchQueue.push(() => partial as Partial<T>);
      }

      if (!isBatching) {
        isBatching = true;
        Promise.resolve().then(processBatch);
      }
    };
  };
};

// 4. Custom Shallow Comparison
export const lucentShallow = <T extends object>(): EqualityFn<T> => {
  return (a: T, b: T) => {
    if (Object.keys(a).length !== Object.keys(b).length) return false;
    
    return Object.keys(a).every(key => {
      const aValue = (a as any)[key];
      const bValue = (b as any)[key];
      return aValue === bValue;
    });
  };
};

// 5. Custom Debounce
export const lucentDebounce = <T extends object>(
  wait: number
): Middleware<T> => {
  return (set, get, store) => {
    let timeoutId: NodeJS.Timeout | null = null;
    let pendingUpdates: (() => Partial<T>)[] = [];

    const processUpdates = () => {
      if (pendingUpdates.length === 0) return;
      
      const currentState = get();
      let newState = { ...currentState } as T;

      pendingUpdates.forEach(update => {
        const partial = update();
        newState = { ...newState, ...partial } as T;
      });

      set(newState);
      pendingUpdates = [];
    };

    return (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (typeof partial === 'function') {
        pendingUpdates.push(() => (partial as (state: T) => T | Partial<T>)(get()));
      } else {
        pendingUpdates.push(() => partial as Partial<T>);
      }

      timeoutId = setTimeout(processUpdates, wait);
    };
  };
};

// 6. Custom DevTools
export const lucentDevTools = <T extends object>(
  options: {
    name?: string;
    enabled?: boolean;
    trace?: boolean;
  } = {}
): Middleware<T> => {
  const { name = 'Lucent Store', enabled = true, trace = false } = options;

  return (set, get, store) => {
    if (!enabled) return set;

    const devTools = {
      init: (state: T) => {
        console.group(`[${name}] Initial State`);
        console.log('State:', state);
        console.groupEnd();
      },
      send: (action: string, state: T) => {
        console.group(`[${name}] Action: ${action}`);
        if (trace) {
          console.trace();
        }
        console.log('State:', state);
        console.groupEnd();
      },
    };

    // Initialize with current state
    devTools.init(get());

    return (partial: T | Partial<T> | ((state: T) => T | Partial<T>)) => {
      const nextState = typeof partial === 'function'
        ? (partial as (state: T) => T | Partial<T>)(get())
        : partial;

      set(nextState);
      devTools.send(
        typeof partial === 'function' ? 'function' : 'action',
        get()
      );
    };
  };
};

// Example usage:

// 1. Using custom memoization
const expensiveComputation = lucentMemo(
  (data: number[]) => data.reduce((sum, num) => sum + num, 0),
  { ttl: 1000 }
);

// 2. Using custom selector
const complexSelector = lucentSelector(
  [
    (state: State) => state.items,
    (state: State) => state.filters,
  ],
  (items: State['items'], filters: State['filters']) => 
    items.filter(item => item.price > filters.minPrice)
);

// 3. Using custom batch
const useStore = create<State>()(
  (set, get, store) => {
    const batchMiddleware = lucentBatch<State>();
    const batchedSet = batchMiddleware(set, get, store);
    
    return {
      items: [],
      filters: { minPrice: 0, category: 'all' },
      query: '',
      addItems: (newItems: State['items']) => {
        batchedSet((state) => ({
          ...state,
          items: [...state.items, ...newItems],
          lastUpdated: new Date(),
        }));
      },
    };
  }
);

// 4. Using custom shallow comparison
const isEqual = lucentShallow<State>();
const state1: State = { 
  items: [{ id: '1', price: 100 }], 
  filters: { minPrice: 0, category: 'all' },
  query: ''
};
const state2: State = { 
  items: [{ id: '1', price: 100 }], 
  filters: { minPrice: 0, category: 'all' },
  query: ''
};
console.log(isEqual(state1, state2)); // true

// 5. Using custom debounce
const useSearchStore = create<State>()(
  (set, get, store) => {
    const debounceMiddleware = lucentDebounce<State>(300);
    const debouncedSet = debounceMiddleware(set, get, store);
    
    return {
      items: [],
      filters: { minPrice: 0, category: 'all' },
      query: '',
      setQuery: (query: string) => debouncedSet((state) => ({
        ...state,
        query,
      })),
    };
  }
);

// 6. Using custom devtools
const useDevStore = create<State>()(
  (set, get, store) => {
    const devToolsMiddleware = lucentDevTools<State>({ name: 'MyStore', trace: true });
    const devToolsSet = devToolsMiddleware(set, get, store);
    
    return {
      items: [],
      filters: { minPrice: 0, category: 'all' },
      query: '',
      addItem: (item: State['items'][0]) => devToolsSet((state) => ({
        ...state,
        items: [...state.items, item],
      })),
    };
  }
); 