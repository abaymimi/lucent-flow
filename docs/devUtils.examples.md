# Development Utilities Examples

This document provides practical examples of using Lucent's development utilities for debugging, monitoring, and type safety.

## Basic Setup

```typescript
import { createDevMiddleware, DevConfig } from "../utils/devUtils";

// Configure development middleware
const devConfig: DevConfig = {
  warnOnLargeState: true,
  warnOnSlowUpdates: true,
  enableTimeTravel: true,
  validateTypes: true,
  maxHistorySize: 100,
  performanceThreshold: 16, // 60fps threshold
  stateSizeThreshold: 100000, // 100KB threshold
};

// Create store with development middleware
const useStore = create(
  createDevMiddleware(devConfig)((set, get) => ({
    // Your store implementation
  }))
);
```

## Type Validation Examples

### Basic Type Validation

```typescript
import { validateType, isType } from "../utils/devUtils";

// Validate a value at runtime
const user = validateType<User>(
  {
    id: 1,
    name: "John",
  },
  "User"
);

// Type guard usage
if (isType<User>(data, "User")) {
  // TypeScript knows data is User here
  console.log(data.name);
}
```

### Custom Type Validation

```typescript
// Define custom validation rules
const validateUser = (user: unknown): User => {
  if (process.env.NODE_ENV === "development") {
    if (!user || typeof user !== "object") {
      throw new Error("Invalid user: must be an object");
    }
    const u = user as User;
    if (!u.id || typeof u.id !== "number") {
      throw new Error("Invalid user: id must be a number");
    }
    if (!u.name || typeof u.name !== "string") {
      throw new Error("Invalid user: name must be a string");
    }
  }
  return user as User;
};
```

## Debugging Examples

### Using Debug Utilities

```typescript
const store = useStore();

// Log current state
store.debug.logState();

// Log action history
store.debug.logActions();

// Log performance metrics
store.debug.logPerformance();

// Take a state snapshot
const snapshot = store.debug.takeSnapshot();

// Get performance metrics
const metrics = store.debug.getPerformanceMetrics();
console.log("Average update time:", metrics.averageUpdateTime);
console.log("Total updates:", metrics.totalUpdates);
console.log("Slow updates:", metrics.slowUpdates);
```

### Time Travel Debugging

```typescript
// Enable time travel in config
const devConfig: DevConfig = {
  enableTimeTravel: true,
};

// Get state history
const history = store.debug.getStateHistory();

// Replay a specific action
store.debug.replayAction("increment");

// Clear history
store.debug.clearHistory();
```

## Performance Monitoring

### Configuring Performance Monitoring

```typescript
const devConfig: DevConfig = {
  warnOnSlowUpdates: true,
  performanceThreshold: 16, // 60fps threshold
  enablePerformanceMonitoring: true,
};

// Monitor performance in your components
useEffect(() => {
  const metrics = store.debug.getPerformanceMetrics();
  if (metrics.slowUpdates > 0) {
    console.warn(`Detected ${metrics.slowUpdates} slow updates`);
  }
}, [store]);
```

### State Size Monitoring

```typescript
const devConfig: DevConfig = {
  warnOnLargeState: true,
  stateSizeThreshold: 100000, // 100KB threshold
};

// Check state size
const stateSize = JSON.stringify(store.getState()).length;
if (stateSize > devConfig.stateSizeThreshold) {
  console.warn("State size exceeds threshold");
}
```

## Error Handling Examples

### Enhanced Error Handling

```typescript
try {
  store.setState(newState);
} catch (error) {
  if (error instanceof EnhancedError) {
    console.error("Error context:", error.context);
    console.error("Error timestamp:", error.timestamp);
  }
  throw error;
}
```

### Development Warnings

```typescript
import { warn } from "../utils/devUtils";

// Simple warning
warn("Deprecated method called");

// Warning with context
warn("Invalid state update", {
  currentState: store.getState(),
  attemptedUpdate: newState,
});
```

## Advanced Usage

### Combining Multiple Features

```typescript
const devConfig: DevConfig = {
  // Type safety
  validateTypes: true,

  // Performance
  warnOnSlowUpdates: true,
  performanceThreshold: 16,

  // State management
  warnOnLargeState: true,
  stateSizeThreshold: 100000,

  // Debugging
  enableTimeTravel: true,
  enableStateSnapshots: true,
  maxHistorySize: 100,
};

// Create enhanced store
const useEnhancedStore = create(
  createDevMiddleware(devConfig)((set, get) => ({
    // Store implementation with type safety
    items: validateType<Item[]>([]),

    // Actions with performance monitoring
    addItem: (item: Item) => {
      const startTime = performance.now();
      set((state) => ({
        items: [...state.items, item],
      }));
      const endTime = performance.now();
      if (endTime - startTime > devConfig.performanceThreshold) {
        warn("Slow item addition", {
          duration: endTime - startTime,
          item,
        });
      }
    },
  }))
);
```

### Custom Debug Extensions

```typescript
// Extend debug utilities
const customDebugUtils = {
  ...store.debug,
  logCustomMetric: (metric: string, value: any) => {
    console.log(`[Custom Metric] ${metric}:`, value);
  },
  trackRenders: () => {
    let renderCount = 0;
    return {
      increment: () => renderCount++,
      getCount: () => renderCount,
    };
  },
};

// Use custom debug utilities
const renderTracker = customDebugUtils.trackRenders();
renderTracker.increment();
console.log("Render count:", renderTracker.getCount());
```

## Best Practices

1. **Enable Development Features Only in Development**

```typescript
const devConfig: DevConfig = {
  ...(process.env.NODE_ENV === "development" && {
    validateTypes: true,
    warnOnSlowUpdates: true,
    enableTimeTravel: true,
  }),
};
```

2. **Use Type Validation for Critical Data**

```typescript
interface User {
  id: number;
  name: string;
}

const validateUser = (user: unknown): User => {
  return validateType<User>(user, "User");
};
```

3. **Monitor Performance in Production**

```typescript
if (process.env.NODE_ENV === "production") {
  // Only enable performance monitoring
  const devConfig: DevConfig = {
    enablePerformanceMonitoring: true,
  };
}
```

4. **Clean Up Debug Data**

```typescript
useEffect(() => {
  return () => {
    // Clear debug data when component unmounts
    store.debug.clearHistory();
  };
}, [store]);
```

## Troubleshooting

### Common Issues and Solutions

1. **Type Validation Errors**

```typescript
// Problem: Type validation failing
try {
  validateType<User>(data, "User");
} catch (error) {
  // Check error context for details
  console.error("Validation failed:", error.context);
}
```

2. **Performance Issues**

```typescript
// Problem: Slow updates
const metrics = store.debug.getPerformanceMetrics();
if (metrics.averageUpdateTime > 16) {
  // Consider optimizing state updates
  console.warn("Average update time exceeds 16ms");
}
```

3. **Large State Size**

```typescript
// Problem: State too large
const stateSize = JSON.stringify(store.getState()).length;
if (stateSize > 100000) {
  // Consider splitting state or implementing pagination
  console.warn("State size exceeds 100KB");
}
```

4. **Memory Leaks**

```typescript
// Problem: Growing action history
useEffect(() => {
  // Clear history periodically
  const interval = setInterval(() => {
    store.debug.clearHistory();
  }, 60000); // Every minute

  return () => clearInterval(interval);
}, [store]);
```
