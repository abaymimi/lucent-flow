# Lucent-Flow API Documentation

## Core API

### Store Creation

```typescript
import { create } from "lucent-flow";

interface State {
  count: number;
  text: string;
}

const useStore = create<State>((set) => ({
  count: 0,
  text: "",
  increment: () => set((state) => ({ count: state.count + 1 })),
  setText: (text: string) => set({ text }),
}));
```

### Store Methods

#### `getState()`

Returns the current state.

```typescript
const state = useStore.getState();
```

#### `setState(partial, replace?)`

Updates the state. Accepts either a partial state object or an updater function.

```typescript
// Using partial state
useStore.setState({ count: 1 });

// Using updater function
useStore.setState((state) => ({ count: state.count + 1 }));

// Replace entire state
useStore.setState(newState, true);
```

#### `subscribe(listener)`

Subscribes to state changes.

```typescript
const unsubscribe = useStore.subscribe((state, prevState) => {
  console.log("State changed:", state);
});
```

## Middleware API

### Development Tools

```typescript
import { devtools } from "lucent-flow/middleware";

const useStore = create<State>()(
  devtools(
    (set) => ({
      // ... state
    }),
    { name: "MyStore" }
  )
);
```

### Logger

```typescript
import { logger } from "lucent-flow/middleware";

const useStore = create<State>()(
  logger(
    (set) => ({
      // ... state
    }),
    { enabled: true }
  )
);
```

### Undo/Redo

```typescript
import { undoRedo } from "lucent-flow/middleware";

const useStore = create<State>()(
  undoRedo(
    (set) => ({
      // ... state
    }),
    { maxHistory: 50 }
  )
);
```

## Storage API

### Persist

```typescript
import { persist } from "lucent-flow/middleware";

const useStore = create<State>()(
  persist(
    (set) => ({
      // ... state
    }),
    {
      name: "my-store",
      storage: "localStorage",
    }
  )
);
```

### Storage Backends

```typescript
import { createStorage } from "lucent-flow/storage";

const storage = createStorage({
  backend: "indexedDB",
  name: "my-db",
  version: 1,
});
```

## Query API

### Base Query

```typescript
import { createBaseQuery } from "lucent-flow/query";

const baseQuery = createBaseQuery({
  baseUrl: "https://api.example.com",
  prepareHeaders: (headers) => {
    headers.set("Authorization", "Bearer token");
    return headers;
  },
});
```

### Query Builder

```typescript
import { createQueryBuilder } from "lucent-flow/query";

const queryBuilder = createQueryBuilder(baseQuery)
  .setEndpoint("posts")
  .setMethod("GET")
  .setParams({ page: 1, limit: 10 })
  .setHeaders({ "Custom-Header": "value" });
```

## Testing API

### Test Utilities

```typescript
import { createTestStore, TestHelper } from "lucent-flow/test";

const store = createTestStore<State>({
  count: 0,
  text: "",
});

const helper = new TestHelper(store);
```

### Snapshot Testing

```typescript
helper.takeSnapshot();
helper.compareSnapshots(0, 1);
```

## Type Definitions

### Store Types

```typescript
interface StoreApi<T> {
  getState: () => T;
  setState: (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean
  ) => void;
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
}
```

### Middleware Types

```typescript
type Middleware = <T extends object>(
  store: StoreApi<T>,
  options?: any
) => (set: StoreApi<T>["setState"]) => StoreApi<T>["setState"];
```

### Storage Types

```typescript
interface StorageConfig {
  backend: "localStorage" | "indexedDB";
  name: string;
  version?: number;
  encryption?: boolean;
}
```

## Error Handling

### Error Types

```typescript
interface LucentFlowError extends Error {
  code: string;
  details?: any;
}
```

### Error Handling

```typescript
try {
  await store.getState().fetchData();
} catch (error) {
  if (error instanceof LucentFlowError) {
    console.error("Lucent-Flow error:", error.code, error.details);
  }
}
```

## Performance Monitoring

### Metrics

```typescript
interface PerformanceMetrics {
  stateSize: number;
  updateTime: number;
  memoryUsage: number;
}
```

### Monitoring

```typescript
const metrics = store.getState().getPerformanceMetrics();
console.log("State size:", metrics.stateSize);
console.log("Update time:", metrics.updateTime);
```
