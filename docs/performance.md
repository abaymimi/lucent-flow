# Performance Guide

This guide outlines performance best practices and optimizations available in the Lucent library.

## Core Performance Features

### 1. Efficient State Updates with Immer

Lucent uses Zustand's built-in Immer integration for efficient immutable state updates:

```typescript
// Efficient immutable updates
set((state) => {
  state.items.push(newItem); // Looks mutable but is actually immutable
});
```

Benefits:

- Structural sharing for minimal memory overhead
- Automatic immutability without deep cloning
- Optimized re-renders by preserving object references

### 2. Request Deduplication

The `lucentQuery` utility automatically deduplicates identical requests:

```typescript
const postQuery = lucentQuery({
  baseUrl: "https://api.example.com",
  enableDeduplication: true,
});
```

This prevents:

- Redundant network requests
- Race conditions
- Unnecessary server load
- Wasted bandwidth

### 3. Advanced Caching

Built-in caching mechanisms:

- TTL-based caching
- Tag-based cache invalidation
- Stale-while-revalidate pattern
- Automatic background revalidation

Example:

```typescript
const query = lucentQuery({
  baseUrl: "https://api.example.com",
  cache: {
    ttl: 5000, // 5 seconds
    tags: ["posts"],
    staleWhileRevalidate: true,
  },
});
```

### 4. Optimistic Updates

Optimistic updates improve perceived performance:

```typescript
createPost: async (post) => {
  // Immediate UI update
  set((state) => ({
    posts: [optimisticPost, ...state.posts],
  }));

  try {
    // API call
    const result = await postQuery({
      /*...*/
    });
    // Update with real data
  } catch {
    // Automatic rollback on error
  }
};
```

## Performance Best Practices

### 1. Selective Re-rendering

Use selectors to prevent unnecessary re-renders:

```typescript
// Create focused selectors
const useFilteredItems = () => useStore((state) => state.getFilteredItems());
const useTotalValue = () => useStore((state) => state.getTotalValue());
```

### 2. State Splitting

Split large stores into smaller, focused ones:

```typescript
const { itemsStore, filtersStore } = splitStore(mainStore, [
  "items",
  "filters",
]);
```

Benefits:

- Reduced re-render scope
- Better code splitting
- Improved maintainability

### 3. Batch Updates

Use batch operations for multiple updates:

```typescript
batchAddItems: (items) =>
  set(
    (state) => {
      const newItems = items.map(/*...*/);
      state.items.push(...newItems);
    },
    false,
    "batchAddItems"
  );
```

### 4. Query Optimization

Optimize API queries:

```typescript
const result = await postQuery({
  url: "/posts",
  params: {
    _page: page,
    _limit: limit,
    _sort: sortBy,
    _order: sortDirection,
  },
});
```

- Use pagination
- Implement sorting on the server
- Filter data server-side
- Select only needed fields

### 5. Middleware Performance

Configure middleware carefully:

```typescript
const store = create(
  devtools(
    immer(
      logger({
        enabled: process.env.NODE_ENV === "development",
      })
    )
  )
);
```

- Disable dev tools in production
- Configure logging levels appropriately
- Use middleware selectively

## Monitoring and Debugging

### 1. Redux DevTools Integration

Monitor performance with Redux DevTools:

- Track state changes
- Measure update frequency
- Profile action timing
- Debug state issues

### 2. Performance Logging

Enable performance logging:

```typescript
const logger = createLogger({
  logPerformance: true,
  performanceThreshold: 16, // 60fps threshold
});
```

### 3. State Snapshots

Create state snapshots for debugging:

```typescript
const debugSnapshot = () => {
  console.log("State Snapshot:", store.getState());
  console.log("Computed Values:", {
    filteredItems: store.getFilteredItems(),
    totalValue: store.getTotalValue(),
  });
};
```

## Common Performance Issues

1. **Over-rendering**: Use selectors and memoization to prevent unnecessary re-renders
2. **Large State Trees**: Split state into smaller, focused stores
3. **Unnecessary Updates**: Use batch operations and debounce/throttle where appropriate
4. **Network Bottlenecks**: Implement proper caching and request deduplication
5. **Memory Leaks**: Clean up subscriptions and event listeners

## Performance Testing

1. **Benchmark Tests**:

   - Measure state update performance
   - Test rendering performance
   - Profile network operations

2. **Load Testing**:

   - Test with large datasets
   - Measure memory usage
   - Profile CPU utilization

3. **Network Testing**:
   - Test caching effectiveness
   - Measure request deduplication
   - Profile API response times

## Future Optimizations

Planned performance improvements:

1. Automatic state persistence optimization
2. Enhanced query batching
3. Improved structural sharing
4. Advanced memoization strategies
5. Worker thread support for heavy computations

## Developer Experience

### 1. TypeScript Integration

Lucent provides enhanced TypeScript support for better type inference and safety:

```typescript
// Automatic type inference for store state
const useStore = create<State>()(
  devtools(
    immer((set, get) => ({
      // TypeScript infers state types automatically
      items: [],
      filters: {
        minPrice: 0,
        category: "all",
        search: "",
      },
      // Type-safe actions
      addItem: (item: Omit<Item, "id">) => {
        set((state) => {
          state.items.push({
            ...item,
            id: Date.now().toString(),
            lastUpdated: new Date(),
          });
        });
      },
    }))
  )
);
```

Features:

- Automatic type inference for state and actions
- Type-safe middleware composition
- Generic type constraints
- Strict null checking

### 2. Runtime Type Checking

Enable runtime type validation in development:

```typescript
const store = create<State>()(
  devtools(
    immer(
      (set, get) => ({
        // Runtime type checking
        items: validateType<Item[]>([]),
        filters: validateType<Filters>({
          minPrice: 0,
          category: "all",
          search: "",
        }),
      }),
      { validateTypes: true }
    )
  )
);
```

Benefits:

- Catch type errors early
- Validate data at runtime
- Prevent invalid state updates
- Better debugging experience

### 3. Development Mode Warnings

Get helpful warnings during development:

```typescript
const store = create<State>()(
  devtools(
    immer(
      (set, get) => ({
        // Development mode warnings
        items: [],
        filters: {
          minPrice: 0,
          category: "all",
          search: "",
        },
      }),
      {
        development: {
          warnOnLargeState: true,
          warnOnSlowUpdates: true,
          warnOnUnusedSelectors: true,
        },
      }
    )
  )
);
```

Warnings include:

- Large state tree detection
- Slow update performance
- Unused selectors
- Potential memory leaks
- Invalid state updates

### 4. Enhanced Error Messages

Get detailed error messages for debugging:

```typescript
try {
  await store.getState().addItem(invalidItem);
} catch (error) {
  // Detailed error messages
  console.error(error.message);
  // Error: Invalid item structure. Expected: { name: string, price: number }
  // Received: { name: string }
  // Missing required field: price
}
```

Features:

- Contextual error messages
- Stack traces with relevant code
- Suggestions for fixes
- Type mismatch details

### 5. Debugging Tools

Built-in debugging utilities:

```typescript
// Enable debugging features
const store = create<State>()(
  devtools(
    immer(
      (set, get) => ({
        // Store implementation
      }),
      {
        debug: {
          logStateChanges: true,
          logActionCalls: true,
          logPerformance: true,
          logTypeErrors: true,
        },
      }
    )
  )
);

// Use debugging utilities
store.debug.logState(); // Log current state
store.debug.logActions(); // Log recent actions
store.debug.logPerformance(); // Log performance metrics
store.debug.logTypeErrors(); // Log type validation errors
```

### 6. Development Mode Features

Development-specific features:

```typescript
const store = create<State>()(
  devtools(
    immer(
      (set, get) => ({
        // Store implementation
      }),
      {
        development: {
          // Enable development features
          enableTimeTravel: true,
          enableStateSnapshots: true,
          enableActionReplay: true,
          enablePerformanceMonitoring: true,
        },
      }
    )
  )
);
```

Features:

- Time-travel debugging
- State snapshots
- Action replay
- Performance monitoring
- Hot module replacement

### 7. Type-Safe Middleware

Type-safe middleware composition:

```typescript
// Define middleware types
type MiddlewareConfig = {
  validateTypes?: boolean;
  development?: boolean;
  debug?: boolean;
};

// Create type-safe middleware
const createMiddleware =
  <T extends object>(config: MiddlewareConfig) =>
  (store: StoreApi<T>) => {
    // Middleware implementation
  };

// Use type-safe middleware
const store = create<State>()(
  devtools(
    immer(
      createMiddleware<State>({
        validateTypes: true,
        development: true,
        debug: true,
      })
    )
  )
);
```

Benefits:

- Type-safe middleware configuration
- Automatic type inference
- Runtime type validation
- Development mode features
